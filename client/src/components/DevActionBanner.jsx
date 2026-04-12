// One clear sentence. Changes every phase. Lives between the strip and the grid.

function getLine(isSpotter, isSpeaker, isNext, phase, spotterName, speakerName) {
  if (isSpotter) {
    if (phase === 'thinking')      return `Listen closely — ${speakerName} is about to perform`
    if (phase === 'recording')     return `Shh — ${speakerName} is performing right now`
    if (phase === 'guessing')      return `Which monster is ${speakerName}? Pick your spot`
    if (phase === 'correct')       return `You got it!`
    if (phase === 'wrong')         return `Not quite — ${speakerName} gets a second chance`
    if (phase === 'second_chance') return `Second chance — listen to ${speakerName} again`
    return `Round over`
  }
  if (isSpeaker) {
    if (phase === 'thinking')      return `Your turn — read the phrase as your monster. Fool ${spotterName}.`
    if (phase === 'recording')     return `Go! Give it everything you've got`
    if (phase === 'guessing')      return `${spotterName} is guessing… don't give anything away`
    if (phase === 'correct')       return `Busted! ${spotterName} heard you`
    if (phase === 'wrong')         return `You slipped past — second chance incoming`
    if (phase === 'second_chance') return `New phrase, same monster — fool ${spotterName} again`
    return `Round over`
  }
  if (isNext)                      return `You're up next — listen to ${speakerName} first`

  if (phase === 'thinking')        return `Listen — ${speakerName} is about to perform`
  if (phase === 'recording')       return `${speakerName} is performing — listen carefully`
  if (phase === 'guessing')        return `${spotterName} is guessing ${speakerName}'s monster`
  if (phase === 'correct')         return `${spotterName} got them!`
  if (phase === 'wrong')           return `${speakerName} slipped through — second chance coming`
  if (phase === 'second_chance')   return `Second chance — ${speakerName} gets another go`
  return `Round over`
}

const ACCENT = {
  spotter:  '#8888dd',
  speaker:  '#f0b429',
  next:     '#aaa',
  audience: '#888',
}

export default function DevActionBanner({ isSpotter, isSpeaker, isNext, phase, spotterName, speakerName }) {
  const roleKey = isSpotter ? 'spotter' : isSpeaker ? 'speaker' : isNext ? 'next' : 'audience'
  const line    = getLine(isSpotter, isSpeaker, isNext, phase, spotterName, speakerName)
  const accent  = ACCENT[roleKey]

  return (
    <div style={{
      padding: '9px 20px',
      background: 'rgba(0,0,0,0.4)',
      borderBottom: `1px solid ${accent}22`,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{
        width: 3,
        alignSelf: 'stretch',
        background: accent,
        borderRadius: 2,
        flexShrink: 0,
        opacity: 1,
      }} />
      <div style={{
        fontFamily: "'MonsterHeadline', sans-serif",
        fontSize: 14,
        color: '#e8e8e8',
        letterSpacing: '0.03em',
        lineHeight: 1.3,
      }}>
        {line}
      </div>
    </div>
  )
}
