import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface SetupScreenProps {
  onComplete: (userId: Id<'users'>, deviceId: Id<'devices'>) => void
}

export function SetupScreen({ onComplete }: SetupScreenProps): JSX.Element {
  const [name, setName] = useState('')
  const [workDuration, setWorkDuration] = useState(50)
  const [breakDuration, setBreakDuration] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const createUser = useMutation(api.users.create)
  const createDevice = useMutation(api.devices.create)
  const seedMessages = useMutation(api.messages.seedDefaults)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsLoading(true)

    try {
      const userId = await createUser({
        name: name.trim(),
        workDurationMins: workDuration,
        breakDurationMins: breakDuration
      })

      const deviceId = await createDevice({
        userId,
        deviceName: `${name}'s Desktop`,
        deviceType: 'desktop'
      })

      await seedMessages({ userId })

      onComplete(userId, deviceId)
    } catch (error) {
      console.error('Setup failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-3xl -translate-y-1/2" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md fade-in-up">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-[2rem] blur-xl -z-10" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-zinc-100 mb-2">
            Welcome to Sentinel
          </h1>
          <p className="text-zinc-500 text-center mb-10">
            Your personal health & productivity enforcer
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                <span>👋</span> Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should I call you?"
                className="w-full px-4 py-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all text-lg"
                autoFocus
                required
              />
            </div>

            {/* Work Duration */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-3">
                <span className="flex items-center gap-2">
                  <span>⏱️</span> Focus Duration
                </span>
                <span className="text-emerald-400 font-mono">{workDuration} min</span>
              </label>
              <input
                type="range"
                min="15"
                max="90"
                step="5"
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>15m</span>
                <span>90m</span>
              </div>
            </div>

            {/* Break Duration */}
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-zinc-300 mb-3">
                <span className="flex items-center gap-2">
                  <span>🚶</span> Break Duration
                </span>
                <span className="text-cyan-400 font-mono">{breakDuration} min</span>
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>5m</span>
                <span>30m</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                name.trim() && !isLoading
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up...
                </>
              ) : (
                <>
                  Get Started
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-10 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <span>✨</span> How it works
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">1</span>
                </div>
                <p className="text-xs text-zinc-500">Timer counts down during work</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">2</span>
                </div>
                <p className="text-xs text-zinc-500">Screen locks when time's up</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">3</span>
                </div>
                <p className="text-xs text-zinc-500">Scan QR code to unlock</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">4</span>
                </div>
                <p className="text-xs text-zinc-500">AI coaches you along the way</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
