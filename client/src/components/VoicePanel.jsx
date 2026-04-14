import { useState } from 'react'
import { useVoiceChat } from '../hooks/useVoiceChat'
import socket from '../socket'

// Renders two buttons inside audio-controls:
//   1. Status/join pill — "Join Voice" (pulsing) | "● Live" | "Muted"
//   2. Mute toggle — always available, even before joining (pre-mute before joining)
export default function VoicePanel({ isMuted }) {
  const [selfMuted, setSelfMuted] = useState(false)
  const effectiveMuted = isMuted || selfMuted
  const { joined, joinVoice } = useVoiceChat(socket, effectiveMuted)

  const showLive = joined && !effectiveMuted

  return (
    <>
      {/* Status / join button — pill with text label */}
      <button
        className={[
          'audio-btn',
          'audio-btn-voice-pill',
          !joined ? 'audio-btn-voice-join' : '',
        ].filter(Boolean).join(' ')}
        onClick={!joined ? joinVoice : undefined}
        style={{ cursor: !joined ? 'pointer' : 'default' }}
        title={!joined ? 'Join voice chat' : showLive ? 'Voice active' : 'Voice muted'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style={{ flexShrink: 0 }}>
          <path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5z"/>
          <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="audio-btn-voice-text">
          {!joined ? 'Join Voice' : showLive ? 'Live' : 'Muted'}
        </span>
        {showLive && <span className="voice-live-dot" />}
      </button>

      {/* Mute toggle — always available */}
      <button
        className={`audio-btn${selfMuted ? ' audio-btn-muted' : ''}${isMuted ? ' audio-btn-muted' : ''}`}
        onClick={() => setSelfMuted(m => !m)}
        title={isMuted ? 'Auto-muted while recording' : selfMuted ? 'Unmute mic' : 'Mute mic'}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          {effectiveMuted ? (
            <>
              <path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5z" opacity="0.4"/>
              <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </>
          ) : (
            <>
              <path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V5z"/>
              <path d="M5 11a7 7 0 0 0 14 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </button>
    </>
  )
}
