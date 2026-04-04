import { useState, useEffect, useRef } from 'react'
import { AVATARS } from '../data/avatars'

export default function ChatPanel({ messages, onSend, myPlayer }) {
  const [text, setText] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const prevLenRef = useRef(messages.length)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Track unread count when panel is closed on mobile
  useEffect(() => {
    const newCount = messages.length - prevLenRef.current
    if (newCount > 0 && !mobileOpen) {
      setUnread(u => u + newCount)
    }
    prevLenRef.current = messages.length
  }, [messages, mobileOpen])

  const handleOpen = () => {
    setMobileOpen(true)
    setUnread(0)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleClose = () => {
    setMobileOpen(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  const panelContent = (
    <div className={`chat-panel${mobileOpen ? ' chat-panel-mobile-open' : ''}`}>
      <div className="chat-header">
        <span className="chat-title">Chat</span>
        <button className="chat-close-btn" onClick={handleClose} aria-label="Close chat">✕</button>
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">No messages yet</div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.playerId === myPlayer?.id
          return (
            <div key={i} className={`chat-msg${isMe ? ' chat-msg-mine' : ''}`}>
              {!isMe && (
                <div className="chat-msg-meta">
                  {msg.avatarId !== undefined && (
                    <img src={AVATARS[msg.avatarId]} alt="" className="chat-msg-avatar" />
                  )}
                  <span className="chat-msg-name">{msg.playerName}</span>
                </div>
              )}
              <div className="chat-msg-bubble">{msg.text}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="chat-input"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Say something..."
          maxLength={200}
          autoComplete="off"
        />
        <button className="chat-send-btn" type="submit">Go!</button>
      </form>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button — only shown on small screens */}
      <button
        className={`chat-toggle-btn${unread > 0 ? ' chat-toggle-btn-unread' : ''}`}
        onClick={handleOpen}
        aria-label="Open chat"
      >
        <span className="chat-toggle-icon">💬</span>
        Chat
        {unread > 0 && <span className="chat-unread-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {/* Panel itself */}
      {panelContent}

      {/* Mobile backdrop */}
      {mobileOpen && <div className="chat-backdrop" onClick={handleClose} />}
    </>
  )
}
