import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface PairingScreenProps {
  deviceId: Id<'devices'>
  onComplete: () => void
  onSkip: () => void
}

export function PairingScreen({ deviceId, onComplete, onSkip }: PairingScreenProps): JSX.Element {
  const [isGenerating, setIsGenerating] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const generatePairingCode = useMutation(api.pairing.generatePairingCode)
  const pairingCode = useQuery(api.pairing.getPairingCode, { deviceId })
  const device = useQuery(api.devices.get, { deviceId })
  const userDevices = useQuery(
    api.devices.listByUser,
    device?.userId ? { userId: device.userId } : 'skip'
  )

  const hasMobileDevice = userDevices?.some((d) => d.deviceType === 'mobile')

  useEffect(() => {
    if (hasMobileDevice) {
      onComplete()
    }
  }, [hasMobileDevice, onComplete])

  // Update time remaining every second
  useEffect(() => {
    if (!pairingCode?.expiresAt) return
    
    const updateTime = () => {
      const remaining = Math.max(0, Math.floor((pairingCode.expiresAt - Date.now()) / 1000))
      setTimeRemaining(remaining)
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [pairingCode?.expiresAt])

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    try {
      await generatePairingCode({ deviceId })
    } catch (error) {
      console.error('Failed to generate pairing code:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const formatDigits = (code: string) => {
    return code.split('').map((digit, i) => (
      <span 
        key={i} 
        className="w-12 h-16 bg-zinc-800/50 rounded-xl flex items-center justify-center text-3xl font-mono font-bold text-zinc-100 border border-zinc-700/50"
        style={{ animationDelay: `${i * 50}ms` }}
      >
        {digit}
      </span>
    ))
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-3xl -translate-y-1/2" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md text-center fade-in-up">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -inset-3 bg-cyan-500/20 rounded-[1.5rem] blur-xl -z-10" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-zinc-100 mb-2">
            Pair Your Phone
          </h1>
          <p className="text-zinc-500 mb-8">
            Connect your mobile device to unlock Sentinel
          </p>

          {/* Pairing Code Display */}
          {pairingCode?.code && timeRemaining > 0 ? (
            <div className="mb-8">
              <div className="flex justify-center gap-2 mb-4">
                {formatDigits(pairingCode.code)}
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Expires in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
              
              {/* Regenerate button */}
              {timeRemaining < 60 && (
                <button
                  onClick={handleGenerateCode}
                  disabled={isGenerating}
                  className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Generate new code
                </button>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <button
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  isGenerating
                    ? 'bg-zinc-800 text-zinc-500 cursor-wait'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Generate Pairing Code
                  </>
                )}
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 text-left mb-6">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <span>📱</span> On your phone
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-800/50 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0">1</span>
                <p className="text-sm text-zinc-500">Open the Sentinel web app</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-800/50 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0">2</span>
                <p className="text-sm text-zinc-500">Tap "Enter Pairing Code"</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-zinc-800/50 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0">3</span>
                <p className="text-sm text-zinc-500">Enter the 6-digit code above</p>
              </li>
            </ol>
          </div>

          {/* Status indicator */}
          {pairingCode?.code && timeRemaining > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-6">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              Waiting for connection...
            </div>
          )}

          {/* Back/Skip Button */}
          <button
            onClick={onSkip}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
