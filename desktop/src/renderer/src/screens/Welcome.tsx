import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface WelcomeScreenProps {
  onComplete: (userId: Id<'users'>, deviceId: Id<'devices'>) => void
}

type Step = 'welcome' | 'problem' | 'solution' | 'benefit' | 'name' | 'ready'

export function WelcomeScreen({ onComplete }: WelcomeScreenProps): JSX.Element {
  const [step, setStep] = useState<Step>('welcome')
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const createUser = useMutation(api.users.create)
  const createDevice = useMutation(api.devices.create)

  const handleGetStarted = async () => {
    if (!name.trim()) return

    setIsCreating(true)
    try {
      const userId = await createUser({
        name: name.trim(),
        workDurationMins: 25, // Start with shorter sessions for new users
        breakDurationMins: 5,
      })

      const deviceId = await createDevice({
        userId,
        deviceName: 'Desktop',
        deviceType: 'desktop',
      })

      onComplete(userId, deviceId)
    } catch (error) {
      console.error('Failed to create user:', error)
      setIsCreating(false)
    }
  }

  const nextStep = () => {
    const steps: Step[] = ['welcome', 'problem', 'solution', 'benefit', 'name', 'ready']
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: Step[] = ['welcome', 'problem', 'solution', 'benefit', 'name', 'ready']
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-8">
        <div className="text-center fade-in-up">
          {/* Logo */}
          <div className="relative mb-8">
            <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="absolute -inset-4 bg-emerald-500/20 rounded-[2rem] blur-xl -z-10" />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-zinc-100 mb-4">Sentinel</h1>
          <p className="text-xl text-zinc-400 mb-12">
            Your guardian for health and productivity
          </p>

          {/* CTA */}
          <button
            onClick={nextStep}
            className="px-12 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  // Problem Screen
  if (step === 'problem') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-8">
        <div className="max-w-lg text-center fade-in-up">
          {/* Illustration */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <span className="text-5xl">😩</span>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Sound familiar?
          </h2>
          <p className="text-xl text-zinc-400 mb-4">
            You've tried reminders.
          </p>
          <p className="text-xl text-zinc-400 mb-4">
            You've tried willpower.
          </p>
          <p className="text-xl text-zinc-400 mb-8">
            But you're still sitting for <span className="text-red-400 font-semibold">hours</span>.
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>

          {/* Navigation */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={prevStep}
              className="px-6 py-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-10 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-xl transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Solution Screen
  if (step === 'solution') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-8">
        <div className="max-w-lg text-center fade-in-up">
          {/* Illustration */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Sentinel is different
          </h2>
          <p className="text-xl text-zinc-400 mb-6">
            It <span className="text-emerald-400 font-semibold">physically locks</span> your screen
            <br />until you walk to your checkpoint.
          </p>

          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 mb-8">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <span className="text-2xl">💻</span>
                </div>
                <p className="text-xs text-zinc-500">Timer ends</p>
              </div>
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-xs text-zinc-500">Screen locks</p>
              </div>
              <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-2xl">🚶</span>
                </div>
                <p className="text-xs text-zinc-500">You move</p>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
          </div>

          {/* Navigation */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={prevStep}
              className="px-6 py-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-10 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium rounded-xl transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Benefit Screen
  if (step === 'benefit') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-8">
        <div className="max-w-lg text-center fade-in-up">
          {/* Illustration */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-5xl">🤖</span>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl font-bold text-zinc-100 mb-4">
            Plus, an AI coach
          </h2>
          <p className="text-xl text-zinc-400 mb-8">
            That learns your goals, understands your challenges,
            <br />and helps you <span className="text-amber-400 font-semibold">stay on track</span>.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { emoji: '🎯', label: 'Pick your task' },
              { emoji: '💪', label: 'Stay focused' },
              { emoji: '🧠', label: 'Beat procrastination' },
              { emoji: '🏆', label: 'Build momentum' },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                <span className="text-2xl mb-2 block">{item.emoji}</span>
                <p className="text-sm text-zinc-400">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-zinc-700" />
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>

          {/* Navigation */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={prevStep}
              className="px-6 py-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="px-10 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
            >
              Let's go!
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Name Input Screen
  if (step === 'name') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-8">
        <div className="w-full max-w-md fade-in-up">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-4xl">👋</span>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl font-bold text-zinc-100 text-center mb-2">
            What should I call you?
          </h2>
          <p className="text-zinc-500 text-center mb-8">
            Just your first name is fine
          </p>

          {/* Input */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                setStep('ready')
              }
            }}
            placeholder="Your name"
            className="w-full px-6 py-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-zinc-100 text-xl text-center placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            autoFocus
          />

          {/* Navigation */}
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={prevStep}
              className="px-6 py-3 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => name.trim() && setStep('ready')}
              disabled={!name.trim()}
              className={`px-10 py-3 font-medium rounded-xl transition-all ${
                name.trim()
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Ready Screen
  if (step === 'ready') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0b] p-8">
        <div className="w-full max-w-md text-center fade-in-up">
          {/* Celebration */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <span className="text-5xl">🚀</span>
            </div>
          </div>

          {/* Content */}
          <h2 className="text-3xl font-bold text-zinc-100 mb-2">
            You're all set, {name.split(' ')[0]}!
          </h2>
          <p className="text-zinc-500 mb-8">
            Let's start your first focus session
          </p>

          {/* Session Preview */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800/50 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-400">First session</span>
              <span className="text-emerald-400 font-semibold">25 minutes</span>
            </div>
            <p className="text-sm text-zinc-600 text-left">
              We start with shorter sessions. You can adjust this anytime in settings.
            </p>
          </div>

          {/* Tip */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
            <p className="text-amber-400/80 text-sm">
              <strong>Tip:</strong> Put your phone in another room. When the screen locks, you'll need to walk there to unlock it!
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={handleGetStarted}
            disabled={isCreating}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isCreating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Setting up...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start First Session
              </>
            )}
          </button>

          {/* Skip option */}
          <button
            onClick={prevStep}
            className="mt-4 text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return <div />
}
