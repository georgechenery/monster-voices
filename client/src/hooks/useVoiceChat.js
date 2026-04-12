import { useEffect, useRef, useState, useCallback } from 'react'
import SimplePeer from 'simple-peer'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

/**
 * Manages a peer-to-peer voice mesh.
 *
 * Flow:
 *  1. Player clicks "Join Voice" → joinVoice() gets mic, emits 'voice_joined' to server
 *  2. Server responds with 'voice_current_peers' (who's already in voice)
 *     → we initiate connections to each of them
 *  3. Server broadcasts 'voice_peer_joined' to everyone else
 *     → they wait for our signals; the signal handler creates a non-initiating peer on demand
 *
 * isMuted: when true, disables audio tracks without tearing down connections
 */
export function useVoiceChat(socket, isMuted) {
  const peersRef       = useRef({})   // { [peerId]: SimplePeer }
  const audioElemsRef  = useRef({})   // { [peerId]: HTMLAudioElement }
  const localStreamRef = useRef(null)
  const isMutedRef     = useRef(isMuted)

  const [joined, setJoined]       = useState(false)
  const [joinError, setJoinError] = useState(null)

  // Keep isMutedRef current and apply immediately to existing tracks
  useEffect(() => {
    isMutedRef.current = isMuted
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !isMuted })
  }, [isMuted])

  // ── Peer helpers ─────────────────────────────────────────────────────────────

  const removePeer = useCallback((peerId) => {
    if (peersRef.current[peerId]) {
      try { peersRef.current[peerId].destroy() } catch (_) {}
      delete peersRef.current[peerId]
    }
    if (audioElemsRef.current[peerId]) {
      audioElemsRef.current[peerId].srcObject = null
      delete audioElemsRef.current[peerId]
    }
  }, [])

  const addPeer = useCallback((peerId, initiator) => {
    if (peersRef.current[peerId]) return // already exists
    if (!localStreamRef.current) return

    const peer = new SimplePeer({
      initiator,
      stream: localStreamRef.current,
      trickle: true,
      config: ICE_SERVERS,
    })

    peer.on('signal', signal => socket.emit('voice_signal', { targetId: peerId, signal }))

    peer.on('stream', stream => {
      let audio = audioElemsRef.current[peerId]
      if (!audio) {
        audio = new Audio()
        audio.autoplay = true
        audioElemsRef.current[peerId] = audio
      }
      audio.srcObject = stream
      audio.play().catch(() => {})
    })

    peer.on('error', err => console.warn('Voice peer error:', peerId, err.message))
    peer.on('close', () => removePeer(peerId))

    peersRef.current[peerId] = peer
  }, [socket, removePeer])

  // ── Socket event handlers (set up once, persist for session) ─────────────────

  useEffect(() => {
    // Server tells us who is already in voice → we initiate to each
    const onCurrentPeers = ({ peers }) => {
      peers.forEach(peerId => addPeer(peerId, true))
    }

    // A new player joined voice → they will initiate to us; signal handler handles it
    // (no action needed — addPeer(initiator=false) happens in onSignal below)
    const onPeerJoined = ({ peerId }) => {
      // They will send us an offer signal; onSignal creates the peer reactively
      void peerId
    }

    // Incoming signal — create non-initiating peer on demand if needed
    const onSignal = ({ fromId, signal }) => {
      if (!localStreamRef.current) return
      if (!peersRef.current[fromId]) addPeer(fromId, false)
      try { peersRef.current[fromId]?.signal(signal) } catch (_) {}
    }

    socket.on('voice_current_peers', onCurrentPeers)
    socket.on('voice_peer_joined',   onPeerJoined)
    socket.on('voice_signal',        onSignal)

    return () => {
      socket.off('voice_current_peers', onCurrentPeers)
      socket.off('voice_peer_joined',   onPeerJoined)
      socket.off('voice_signal',        onSignal)
    }
  }, [socket, addPeer])

  // ── Join voice chat ───────────────────────────────────────────────────────────

  const joinVoice = useCallback(async () => {
    if (joined) return
    if (!window.isSecureContext) { setJoinError('needs_https'); return }
    if (!navigator.mediaDevices?.getUserMedia) { setJoinError('not_supported'); return }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      stream.getAudioTracks().forEach(t => { t.enabled = !isMutedRef.current })
      localStreamRef.current = stream
      setJoined(true)
      setJoinError(null)
      socket.emit('voice_joined')
    } catch (err) {
      const name = err?.name ?? ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setJoinError('denied')
      } else {
        setJoinError('error')
      }
    }
  }, [joined, socket])

  // ── Cleanup on unmount ────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      Object.keys(peersRef.current).forEach(id => removePeer(id))
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
  }, [removePeer])

  return { joined, joinVoice, joinError }
}
