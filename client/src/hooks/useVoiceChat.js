import { useEffect, useRef, useState, useCallback } from 'react'

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

const log = (...args) => console.log('[VoiceChat]', ...args)

function createPC(peerId, localStream, socket, audioElemsRef, pcsRef) {
  const pc = new RTCPeerConnection(RTC_CONFIG)

  // Add local tracks so the remote side gets our audio
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream))

  // Send ICE candidates to the peer via server
  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      socket.emit('voice_signal', { targetId: peerId, signal: { type: 'candidate', candidate } })
    }
  }

  pc.onconnectionstatechange = () => {
    log('connection state with', peerId, '→', pc.connectionState)
  }

  // When we receive their audio track, play it
  pc.ontrack = ({ streams }) => {
    log('received audio stream from', peerId)
    let audio = audioElemsRef.current[peerId]
    if (!audio) {
      audio = new Audio()
      audioElemsRef.current[peerId] = audio
    }
    audio.srcObject = streams[0]
    audio.play().catch(err => log('audio.play() blocked:', err.message))
  }

  pcsRef.current[peerId] = pc
  return pc
}

export function useVoiceChat(socket, isMuted) {
  const pcsRef         = useRef({})   // { [peerId]: RTCPeerConnection }
  const audioElemsRef  = useRef({})   // { [peerId]: HTMLAudioElement }
  const localStreamRef = useRef(null)
  const isMutedRef     = useRef(isMuted)

  const [joined, setJoined]       = useState(false)
  const [joinError, setJoinError] = useState(null)

  // Apply mute changes immediately to existing tracks
  useEffect(() => {
    isMutedRef.current = isMuted
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !isMuted })
  }, [isMuted])

  // ── Close a single peer connection cleanly ────────────────────────────────────
  const removePC = useCallback((peerId) => {
    log('removePC', peerId)
    pcsRef.current[peerId]?.close()
    delete pcsRef.current[peerId]
    if (audioElemsRef.current[peerId]) {
      audioElemsRef.current[peerId].srcObject = null
      delete audioElemsRef.current[peerId]
    }
  }, [])

  // ── Socket signal handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const onSignal = async ({ fromId, signal }) => {
      if (!localStreamRef.current) { log('signal arrived but no local stream yet'); return }

      try {
        if (signal.type === 'offer') {
          log('received offer from', fromId)
          // Create a PC as the answerer if we don't have one yet
          if (!pcsRef.current[fromId]) {
            createPC(fromId, localStreamRef.current, socket, audioElemsRef, pcsRef)
          }
          const pc = pcsRef.current[fromId]
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.emit('voice_signal', { targetId: fromId, signal: { type: 'answer', sdp: answer } })
          log('sent answer to', fromId)

        } else if (signal.type === 'answer') {
          log('received answer from', fromId)
          const pc = pcsRef.current[fromId]
          if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))

        } else if (signal.type === 'candidate') {
          const pc = pcsRef.current[fromId]
          if (pc) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
        }
      } catch (err) {
        log('signal handling error:', err.message)
      }
    }

    // Server tells us who's already in voice → we initiate (create offer)
    const onCurrentPeers = async ({ peers }) => {
      log('voice_current_peers →', peers)
      for (const peerId of peers) {
        if (!localStreamRef.current) continue
        if (pcsRef.current[peerId]) continue
        try {
          log('initiating offer to', peerId)
          const pc = createPC(peerId, localStreamRef.current, socket, audioElemsRef, pcsRef)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          socket.emit('voice_signal', { targetId: peerId, signal: { type: 'offer', sdp: offer } })
        } catch (err) {
          log('offer creation error:', err.message)
        }
      }
    }

    const onPeerJoined = ({ peerId }) => {
      log('voice_peer_joined →', peerId, '(waiting for their offer)')
      // They will send us an offer — onSignal handles it reactively
    }

    socket.on('voice_signal',        onSignal)
    socket.on('voice_current_peers', onCurrentPeers)
    socket.on('voice_peer_joined',   onPeerJoined)

    return () => {
      socket.off('voice_signal',        onSignal)
      socket.off('voice_current_peers', onCurrentPeers)
      socket.off('voice_peer_joined',   onPeerJoined)
    }
  }, [socket])

  // ── Join voice chat ───────────────────────────────────────────────────────────
  const joinVoice = useCallback(async () => {
    if (joined) return
    log('joinVoice: requesting mic...')
    if (!window.isSecureContext) { log('not a secure context'); setJoinError('needs_https'); return }
    if (!navigator.mediaDevices?.getUserMedia) { setJoinError('not_supported'); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      log('mic granted, tracks:', stream.getAudioTracks().length)
      stream.getAudioTracks().forEach(t => { t.enabled = !isMutedRef.current })
      localStreamRef.current = stream
      setJoined(true)
      setJoinError(null)
      log('emitting voice_joined')
      socket.emit('voice_joined')
    } catch (err) {
      log('mic error:', err.name, err.message)
      const name = err?.name ?? ''
      setJoinError(name === 'NotAllowedError' || name === 'PermissionDeniedError' ? 'denied' : 'error')
    }
  }, [joined, socket])

  // ── Cleanup on unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      Object.keys(pcsRef.current).forEach(id => removePC(id))
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
  }, [removePC])

  return { joined, joinVoice, joinError }
}
