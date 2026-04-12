import { useState } from 'react'
import { useVoiceChat } from '../hooks/useVoiceChat'
import socket from '../socket'

export default function VoicePanel({ isMuted }) {
  const [selfMuted, setSelfMuted] = useState(false)
  const effectiveMuted = isMuted || selfMuted
  const { joined, joinVoice, joinError } = useVoiceChat(socket, effectiveMuted)

  const errorText = {
    denied:        'Mic access denied — check browser settings',
    needs_https:   'Voice chat requires HTTPS',
    not_supported: 'Voice chat not supported in this browser',
    error:         'Could not access microphone',
  }

  return (
    <div className="voice-panel">
      <div className="voice-panel-inner">
        <span className="voice-panel-label">
          {effectiveMuted ? '🔇' : '🎤'} Voice
        </span>

        {!joined ? (
          <button className="voice-join-btn" onClick={joinVoice}>
            Join Voice
          </button>
        ) : (
          <>
            {isMuted ? (
              <span className="voice-muted-label">Listening…</span>
            ) : (
              <span className="voice-live-label">Live</span>
            )}
            <button
              className={`voice-self-mute-btn${selfMuted ? ' voice-self-mute-btn-on' : ''}`}
              onClick={() => setSelfMuted(m => !m)}
              title={selfMuted ? 'Unmute yourself' : 'Mute yourself'}
            >
              {selfMuted ? '🔇 Unmute' : '🎤 Mute'}
            </button>
          </>
        )}

        {joinError && (
          <span className="voice-error">{errorText[joinError] ?? 'Error'}</span>
        )}
      </div>
    </div>
  )
}
