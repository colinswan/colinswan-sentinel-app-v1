import { useEffect, useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface LockedScreenProps {
  isDevMode?: boolean
  lockMessage?: string
  currentTask?: string
  deviceId?: Id<'devices'>
}

const EMERGENCY_PHRASE = "I understand this defeats the purpose"
const TAPS_TO_REVEAL = 5
const TAP_TIMEOUT = 2000

const getCategoryData = (message: string) => {
  const lower = message.toLowerCase()
  if (lower.includes('squat') || lower.includes('push') || lower.includes('jump') || lower.includes('stretch')) {
    return { emoji: '💪', color: 'from-orange-500 to-red-500', label: 'Exercise' }
  }
  if (lower.includes('walk') || lower.includes('step') || lower.includes('move') || lower.includes('lap')) {
    return { emoji: '🚶', color: 'from-emerald-500 to-teal-500', label: 'Movement' }
  }
  if (lower.includes('eye') || lower.includes('look') || lower.includes('blink') || lower.includes('focus')) {
    return { emoji: '👁️', color: 'from-blue-500 to-cyan-500', label: 'Eye Rest' }
  }
  if (lower.includes('water') || lower.includes('drink') || lower.includes('hydrate')) {
    return { emoji: '💧', color: 'from-cyan-500 to-blue-500', label: 'Hydration' }
  }
  if (lower.includes('breath') || lower.includes('outside') || lower.includes('fresh air')) {
    return { emoji: '🌬️', color: 'from-teal-500 to-green-500', label: 'Fresh Air' }
  }
  return { emoji: '🎯', color: 'from-purple-500 to-pink-500', label: 'Break' }
}

export function LockedScreen({ isDevMode, lockMessage, currentTask, deviceId }: LockedScreenProps): JSX.Element {
  const [seconds, setSeconds] = useState(0)
  const [tapCount, setTapCount] = useState(0)
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false)
  const [emergencyInput, setEmergencyInput] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const emergencyUnlockMutation = useMutation(api.devices.emergencyUnlock)

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Reset tap count after timeout
  useEffect(() => {
    if (tapCount > 0 && tapCount < TAPS_TO_REVEAL) {
      const timer = setTimeout(() => setTapCount(0), TAP_TIMEOUT)
      return () => clearTimeout(timer)
    }
  }, [tapCount])

  const handleDevEmergencyUnlock = async () => {
    if (isDevMode) {
      await window.sentinelAPI.emergencyUnlock()
    }
  }

  const handleCornerTap = useCallback(() => {
    const newCount = tapCount + 1
    setTapCount(newCount)
    if (newCount >= TAPS_TO_REVEAL) {
      setShowEmergencyPanel(true)
      setTapCount(0)
    }
  }, [tapCount])

  const handleEmergencyUnlock = async () => {
    if (emergencyInput.toLowerCase() !== EMERGENCY_PHRASE.toLowerCase()) {
      setErrorMessage('Phrase does not match. Type it exactly.')
      return
    }

    if (!deviceId) {
      setErrorMessage('Device not found')
      return
    }

    setIsUnlocking(true)
    setErrorMessage('')

    try {
      await emergencyUnlockMutation({ deviceId, reason: 'Emergency override activated' })
      await window.sentinelAPI.exitLockdown()
    } catch {
      setErrorMessage('Failed to unlock. Please try again.')
      setIsUnlocking(false)
    }
  }

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const displayMessage = lockMessage || 'Time to move! Walk to your checkpoint.'
  const { emoji, color } = getCategoryData(displayMessage)

  // Emergency Override Panel
  if (showEmergencyPanel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0b]">
        <div className="w-full max-w-md scale-in">
          {/* Warning Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="absolute -inset-2 bg-amber-500/20 rounded-[2rem] blur-xl -z-10" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-zinc-100 text-center mb-2">Emergency Override</h1>
          <p className="text-zinc-500 text-center mb-8">
            This should only be used for genuine emergencies.
          </p>

          {/* Input Card */}
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              Type the following phrase to unlock:
            </label>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
              <p className="text-amber-400 font-mono text-center text-sm">
                "{EMERGENCY_PHRASE}"
              </p>
            </div>
            <input
              type="text"
              value={emergencyInput}
              onChange={(e) => setEmergencyInput(e.target.value)}
              placeholder="Type the phrase exactly..."
              className="w-full px-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
              autoFocus
            />
            {errorMessage && (
              <p className="text-red-400 text-sm mt-3">{errorMessage}</p>
            )}
            {emergencyInput.length > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <p className={`text-sm ${emergencyInput.toLowerCase() === EMERGENCY_PHRASE.toLowerCase() ? 'text-emerald-400' : 'text-zinc-600'}`}>
                  {emergencyInput.toLowerCase() === EMERGENCY_PHRASE.toLowerCase() ? '✓ Phrase matches' : `${Math.max(0, EMERGENCY_PHRASE.length - emergencyInput.length)} more characters`}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleEmergencyUnlock}
              disabled={emergencyInput.toLowerCase() !== EMERGENCY_PHRASE.toLowerCase() || isUnlocking}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
                emergencyInput.toLowerCase() === EMERGENCY_PHRASE.toLowerCase() && !isUnlocking
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isUnlocking ? 'Unlocking...' : 'Emergency Unlock'}
            </button>
            <button
              onClick={() => {
                setShowEmergencyPanel(false)
                setEmergencyInput('')
                setErrorMessage('')
              }}
              className="w-full py-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Reminder */}
          <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400/80 text-xs text-center leading-relaxed">
              Using emergency unlock defeats Sentinel's purpose.
              <br />Can you walk to the checkpoint instead?
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main Lock Screen
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] relative overflow-hidden">
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-red-500/5 blur-3xl -translate-y-1/2" />
      
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
      
      {/* Hidden tap target */}
      <button onClick={handleCornerTap} className="fixed top-0 left-0 w-16 h-16 opacity-0 z-50" aria-label="Emergency override" />
      
      {/* Tap indicator */}
      {tapCount > 0 && tapCount < TAPS_TO_REVEAL && (
        <div className="fixed top-4 left-4 text-zinc-700 text-xs font-mono">
          {TAPS_TO_REVEAL - tapCount}...
        </div>
      )}

      {/* Dev mode button */}
      {isDevMode && (
        <button
          onClick={handleDevEmergencyUnlock}
          className="fixed top-4 right-4 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors z-50"
        >
          🔧 DEV UNLOCK
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        {/* Lock Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-2xl shadow-red-500/30 pulse-glow">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="absolute -inset-4 bg-red-500/20 rounded-[2rem] blur-xl -z-10 animate-pulse" />
        </div>

        {/* Status */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-zinc-100 mb-2">Screen Locked</h1>
          <p className="text-zinc-500">Time to take a break</p>
        </div>

        {/* Action Card */}
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-6 border border-zinc-800/50 mb-6 fade-in-up">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <span className="text-3xl">{emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-zinc-100 leading-snug">{displayMessage}</p>
              <p className="text-zinc-500 text-sm mt-1">Scan QR checkpoint with your phone</p>
            </div>
          </div>
        </div>

        {/* Current Task */}
        {currentTask && (
          <div className="w-full max-w-md bg-zinc-900/50 rounded-2xl px-5 py-4 border border-zinc-800/50 mb-6 fade-in-up">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">You were working on</p>
            <p className="text-zinc-300">{currentTask}</p>
          </div>
        )}

        {/* Timer */}
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-lg">{formatDuration(seconds)}</span>
          <span className="text-zinc-600">locked</span>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-8 text-center">
        <p className="text-zinc-600 text-sm mb-1">
          Movement is essential for your health
        </p>
        <p className="text-zinc-700 text-xs">
          HME + DVT Prevention
        </p>
      </div>

      {/* Dev mode hint */}
      {isDevMode && (
        <div className="fixed bottom-24 left-0 right-0 text-center">
          <p className="text-amber-500/60 text-xs">
            DEV: Cmd+Shift+Escape to unlock
          </p>
        </div>
      )}

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
    </div>
  )
}
