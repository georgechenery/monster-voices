import { useEffect, useRef, useState, useCallback } from 'react'
import SimplePeer from 'simple-peer'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
}

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
  return types.find(t => MediaRecorder.isTypeSupported(t)) || ''
}

const WAVEFORM_LEN = 60      // samples kept in history (60 × 100ms = 6 s of waveform)
const SAMPLE_INTERVAL_MS = 100

export function useWebRTC(socket, isSpeaker, isListener, speakerId) {
  // Speaker refs
  const micStreamRef = useRef(null)
  const speakerPeersRef = useRef({})
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const animFrameRef = useRef(null)
  const recorderRef = useRef(null)
  const recorderChunksRef = useRef([])
  const mimeTypeRef = useRef('')
  const waveformBufferRef = useRef([])
  const lastSampleTimeRef = useRef(0)

  // Listener refs
  const listenerPeerRef = useRef(null)
  const currentSpeakerIdRef = useRef(null)
  const liveAudioRef = useRef(null)
  const replayAudioRef = useRef(null)

  // State
  const [micLevel, setMicLevel] = useState(0)
  const [micActive, setMicActive] = useState(false)
  const [waveformHistory, setWaveformHistory] = useState([])
  const [audioUnlocked, setAudioUnlocked] = useState(() => localStorage.getItem('audioUnlocked') === 'true')
  const [audioBlocked, setAudioBlocked] = useState(false)
  const [replayUrl, setReplayUrl] = useState(null)

  // ---- AUDIO UNLOCK ----
  const unlockAudio = useCallback(() => {
    localStorage.setItem('audioUnlocked', 'true')
    setAudioUnlocked(true)
    setAudioBlocked(false)
    if (liveAudioRef.current && liveAudioRef.current.srcObject) {
      liveAudioRef.current.play().catch(() => {})
    }
  }, [])

  // ---- Shared teardown helper (does NOT upload) ----
  const teardownMic = useCallback((clearWaveform = true) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
    setMicLevel(0)
    setMicActive(false)
    if (clearWaveform) {
      setWaveformHistory([])
      waveformBufferRef.current = []
      lastSampleTimeRef.current = 0
    }
  }, [])

  // ---- SPEAKER: start mic ----
  const startMic = useCallback(async () => {
    if (!window.isSecureContext) return 'needs_https'
    if (!navigator.mediaDevices?.getUserMedia) return 'not_supported'
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      micStreamRef.current = stream
      setMicActive(true)

      // Analyser for waveform + level
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      audioContext.createMediaStreamSource(stream).connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      waveformBufferRef.current = []
      lastSampleTimeRef.current = 0

      function measure(timestamp) {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        const level = Math.min(100, Math.round((avg / 128) * 100))
        setMicLevel(level)

        // Push a new waveform sample at fixed interval
        if (timestamp - lastSampleTimeRef.current >= SAMPLE_INTERVAL_MS) {
          lastSampleTimeRef.current = timestamp
          const next = [...waveformBufferRef.current, level / 100].slice(-WAVEFORM_LEN)
          waveformBufferRef.current = next
          setWaveformHistory(next)
        }

        animFrameRef.current = requestAnimationFrame(measure)
      }
      animFrameRef.current = requestAnimationFrame(measure)

      // Start recording
      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType
      recorderChunksRef.current = []
      try {
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
        recorder.ondataavailable = (e) => {
          if (e.data?.size > 0) recorderChunksRef.current.push(e.data)
        }
        recorder.start(200)
        recorderRef.current = recorder
      } catch (e) {
        console.error('MediaRecorder start error:', e)
      }

      socket.emit('speaker_ready')
      return true
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') return 'denied'
      return 'error'
    }
  }, [socket])

  // ---- SPEAKER: stop mic, capture blob for review (does NOT upload) ----
  // Returns { blob, mimeType } or null
  const stopForReview = useCallback(() => {
    teardownMic(false) // keep waveformHistory intact so component can snapshot it

    const stream = micStreamRef.current
    micStreamRef.current = null
    const recorder = recorderRef.current
    recorderRef.current = null

    return new Promise(resolve => {
      if (!recorder || recorder.state === 'inactive') {
        stream?.getTracks().forEach(t => t.stop())
        resolve(null)
        return
      }
      recorder.onstop = () => {
        stream?.getTracks().forEach(t => t.stop())
        const chunks = recorderChunksRef.current
        recorderChunksRef.current = []
        if (!chunks.length) { resolve(null); return }
        const mimeType = mimeTypeRef.current || 'audio/webm'
        resolve({ blob: new Blob(chunks, { type: mimeType }), mimeType })
      }
      recorder.stop()
    })
  }, [teardownMic])

  // ---- SPEAKER: upload a previously captured blob ----
  const uploadBlob = useCallback(({ blob, mimeType }) => {
    const reader = new FileReader()
    reader.onload = () => {
      socket.emit('audio_upload', { audioData: reader.result, mimeType })
    }
    reader.readAsDataURL(blob)
  }, [socket])

  // ---- SPEAKER: discard recording without uploading (retry path) ----
  const stopMicOnly = useCallback(() => {
    teardownMic(true)
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null
      recorder.onstop = null
      try { recorder.stop() } catch (e) {}
    }
    recorderChunksRef.current = []
    micStreamRef.current?.getTracks().forEach(t => t.stop())
    micStreamRef.current = null
  }, [teardownMic])

  // ---- SPEAKER: stop and upload immediately (legacy / direct submit path) ----
  const stopMicAndUpload = useCallback(() => {
    teardownMic(true)

    const stream = micStreamRef.current
    micStreamRef.current = null
    const recorder = recorderRef.current
    recorderRef.current = null

    if (!recorder || recorder.state === 'inactive') {
      stream?.getTracks().forEach(t => t.stop())
      return
    }

    recorder.onstop = () => {
      stream?.getTracks().forEach(t => t.stop())
      const chunks = recorderChunksRef.current
      if (chunks.length === 0) return
      const mimeType = mimeTypeRef.current || 'audio/webm'
      const blob = new Blob(chunks, { type: mimeType })
      const reader = new FileReader()
      reader.onload = () => {
        socket.emit('audio_upload', { audioData: reader.result, mimeType })
      }
      reader.readAsDataURL(blob)
    }
    recorder.stop()
  }, [socket, teardownMic])

  // ---- SPEAKER: handle incoming WebRTC signals from listeners ----
  useEffect(() => {
    if (!isSpeaker) return

    function handleSignal({ fromId, signal }) {
      if (!micStreamRef.current) return
      if (!speakerPeersRef.current[fromId]) {
        const peer = new SimplePeer({
          initiator: false,
          stream: micStreamRef.current,
          trickle: true,
          config: ICE_SERVERS
        })
        peer.on('signal', sig => socket.emit('webrtc_signal', { targetId: fromId, signal: sig }))
        peer.on('error', err => console.error('Speaker peer error:', err))
        peer.on('close', () => { delete speakerPeersRef.current[fromId] })
        speakerPeersRef.current[fromId] = peer
      }
      try { speakerPeersRef.current[fromId].signal(signal) } catch (e) {}
    }

    socket.on('webrtc_signal', handleSignal)
    return () => {
      socket.off('webrtc_signal', handleSignal)
      Object.values(speakerPeersRef.current).forEach(p => { try { p.destroy() } catch(e) {} })
      speakerPeersRef.current = {}
    }
  }, [isSpeaker, socket])

  // ---- LISTENER: connect via WebRTC + receive recording ----
  useEffect(() => {
    if (!isListener) return

    function connectToSpeaker({ speakerId: sid }) {
      if (currentSpeakerIdRef.current === sid && listenerPeerRef.current) return

      if (listenerPeerRef.current) {
        try { listenerPeerRef.current.destroy() } catch(e) {}
        listenerPeerRef.current = null
      }
      setReplayUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null })
      currentSpeakerIdRef.current = sid

      const peer = new SimplePeer({ initiator: true, trickle: true, config: ICE_SERVERS })
      peer.on('signal', signal => socket.emit('webrtc_signal', { targetId: sid, signal }))
      peer.on('stream', (stream) => {
        if (liveAudioRef.current) {
          liveAudioRef.current.srcObject = stream
          liveAudioRef.current.play().catch(() => setAudioBlocked(true))
        }
      })
      peer.on('error', err => console.error('Listener peer error:', err))
      peer.on('close', () => { if (listenerPeerRef.current === peer) listenerPeerRef.current = null })
      listenerPeerRef.current = peer
    }

    function handleSignal({ fromId, signal }) {
      if (fromId !== currentSpeakerIdRef.current) return
      if (!listenerPeerRef.current) return
      try { listenerPeerRef.current.signal(signal) } catch(e) {}
    }

    function handleAudioReady({ audioData, mimeType }) {
      const url = audioData
      setReplayUrl(url)
      if (replayAudioRef.current) {
        replayAudioRef.current.src = url
        replayAudioRef.current.play().catch(() => {})
      }
    }

    socket.on('connect_to_speaker', connectToSpeaker)
    socket.on('webrtc_signal', handleSignal)
    socket.on('audio_ready', handleAudioReady)

    return () => {
      socket.off('connect_to_speaker', connectToSpeaker)
      socket.off('webrtc_signal', handleSignal)
      socket.off('audio_ready', handleAudioReady)
      if (listenerPeerRef.current) {
        try { listenerPeerRef.current.destroy() } catch(e) {}
        listenerPeerRef.current = null
      }
      currentSpeakerIdRef.current = null
    }
  }, [isListener, socket])

  // Reset when speaker changes
  useEffect(() => {
    if (!isListener || speakerId === currentSpeakerIdRef.current) return
    if (listenerPeerRef.current) {
      try { listenerPeerRef.current.destroy() } catch(e) {}
      listenerPeerRef.current = null
    }
    currentSpeakerIdRef.current = null
    setReplayUrl(null)
  }, [speakerId, isListener])

  const handleReplay = useCallback(() => {
    if (!replayAudioRef.current || !replayUrl) return
    replayAudioRef.current.src = replayUrl
    replayAudioRef.current.currentTime = 0
    replayAudioRef.current.play().catch(e => console.error('Replay error:', e))
  }, [replayUrl])

  return {
    startMic, stopMicAndUpload, stopForReview, stopMicOnly, uploadBlob,
    micLevel, micActive, waveformHistory,
    liveAudioRef, replayAudioRef,
    audioUnlocked, audioBlocked, unlockAudio,
    replayUrl, handleReplay
  }
}
