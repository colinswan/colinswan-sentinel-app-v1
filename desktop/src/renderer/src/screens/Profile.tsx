import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface ProfileScreenProps {
  userId: Id<'users'>
  onComplete: () => void
  isOnboarding?: boolean
}

type Challenge = 'procrastination' | 'imposter_syndrome' | 'decision_paralysis' | 'perfectionism' | 'distraction' | 'overwork'
type WorkStyle = 'deep_focus' | 'pomodoro' | 'flexible'
type MotivationStyle = 'tough_love' | 'encouraging' | 'analytical' | 'collaborative'

const CHALLENGES: { id: Challenge; label: string; emoji: string; description: string; color: string }[] = [
  { id: 'procrastination', label: 'Procrastination', emoji: '⏰', description: 'Delaying tasks I know I should do', color: 'from-orange-500 to-amber-500' },
  { id: 'imposter_syndrome', label: 'Imposter Syndrome', emoji: '🎭', description: 'Doubting my skills', color: 'from-purple-500 to-pink-500' },
  { id: 'decision_paralysis', label: 'Decision Paralysis', emoji: '🤔', description: 'Struggling to decide', color: 'from-blue-500 to-cyan-500' },
  { id: 'perfectionism', label: 'Perfectionism', emoji: '✨', description: "Can't ship until perfect", color: 'from-yellow-500 to-orange-500' },
  { id: 'distraction', label: 'Distraction', emoji: '📱', description: 'Pulled by notifications', color: 'from-red-500 to-pink-500' },
  { id: 'overwork', label: 'Overwork', emoji: '🔥', description: 'Forgetting breaks', color: 'from-emerald-500 to-teal-500' },
]

const WORK_STYLES: { id: WorkStyle; label: string; emoji: string; description: string }[] = [
  { id: 'deep_focus', label: 'Deep Focus', emoji: '🎯', description: 'Long uninterrupted blocks (90+ mins)' },
  { id: 'pomodoro', label: 'Pomodoro', emoji: '🍅', description: 'Short bursts with breaks (25-50 mins)' },
  { id: 'flexible', label: 'Flexible', emoji: '🌊', description: 'Varies by task and energy' },
]

const MOTIVATION_STYLES: { id: MotivationStyle; label: string; emoji: string; example: string }[] = [
  { id: 'tough_love', label: 'Tough Love', emoji: '💪', example: '"Stop making excuses. Ship it."' },
  { id: 'encouraging', label: 'Encouraging', emoji: '🌟', example: '"You\'re doing great! Keep it up!"' },
  { id: 'analytical', label: 'Analytical', emoji: '🧠', example: '"Here\'s why this will work..."' },
  { id: 'collaborative', label: 'Collaborative', emoji: '🤝', example: '"Let\'s figure this out together."' },
]

export function ProfileScreen({ userId, onComplete, isOnboarding = false }: ProfileScreenProps): JSX.Element {
  const [step, setStep] = useState(1)
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [workStyle, setWorkStyle] = useState<WorkStyle>('pomodoro')
  const [motivationStyle, setMotivationStyle] = useState<MotivationStyle>('encouraging')
  const [bigPictureGoal, setBigPictureGoal] = useState('')
  const [currentFocus, setCurrentFocus] = useState('')
  const [personalContext, setPersonalContext] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const existingProfile = useQuery(api.userProfiles.get, { userId })
  const upsertProfile = useMutation(api.userProfiles.upsert)

  useEffect(() => {
    if (existingProfile) {
      setChallenges(existingProfile.challenges as Challenge[])
      setWorkStyle(existingProfile.workStyle as WorkStyle)
      setMotivationStyle(existingProfile.motivationStyle as MotivationStyle)
      setBigPictureGoal(existingProfile.bigPictureGoal || '')
      setCurrentFocus(existingProfile.currentFocus || '')
      setPersonalContext(existingProfile.personalContext || '')
    }
  }, [existingProfile])

  const toggleChallenge = (challenge: Challenge) => {
    setChallenges(prev => 
      prev.includes(challenge)
        ? prev.filter(c => c !== challenge)
        : [...prev, challenge]
    )
  }

  const handleSave = async () => {
    if (challenges.length === 0) return
    
    setIsSaving(true)
    try {
      await upsertProfile({
        userId,
        challenges,
        workStyle,
        motivationStyle,
        bigPictureGoal: bigPictureGoal.trim() || undefined,
        currentFocus: currentFocus.trim() || undefined,
        personalContext: personalContext.trim() || undefined,
      })
      onComplete()
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const totalSteps = 4
  const canProceed = step === 1 ? challenges.length > 0 : true

  const STEP_INFO = [
    { title: 'Challenges', icon: '🎯' },
    { title: 'Work Style', icon: '⚡' },
    { title: 'Coaching', icon: '🎙️' },
    { title: 'Goals', icon: '🌟' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={onComplete}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">{isOnboarding ? 'Skip' : 'Close'}</span>
          </button>

          {/* Step Indicators */}
          <div className="flex items-center gap-1">
            {STEP_INFO.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i + 1)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                  step === i + 1
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : i + 1 < step
                    ? 'text-emerald-500/50 hover:text-emerald-400'
                    : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                <span>{s.icon}</span>
                {step === i + 1 && <span className="font-medium">{s.title}</span>}
              </button>
            ))}
          </div>

          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl fade-in-up">
          
          {/* Step 1: Challenges */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-4 shadow-lg shadow-orange-500/20">
                  <span className="text-3xl">🎯</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">What do you struggle with?</h2>
                <p className="text-zinc-500">Select all that apply — helps tailor AI coaching</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {CHALLENGES.map((challenge) => (
                  <button
                    key={challenge.id}
                    onClick={() => toggleChallenge(challenge.id)}
                    className={`group relative p-4 rounded-2xl border text-left transition-all ${
                      challenges.includes(challenge.id)
                        ? 'bg-zinc-800/50 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    {challenges.includes(challenge.id) && (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${challenge.color} flex items-center justify-center mb-3 shadow-lg`}>
                      <span className="text-xl">{challenge.emoji}</span>
                    </div>
                    <p className="font-semibold text-zinc-100 mb-1">{challenge.label}</p>
                    <p className="text-xs text-zinc-500">{challenge.description}</p>
                  </button>
                ))}
              </div>

              {challenges.length > 0 && (
                <p className="text-center text-sm text-emerald-400 mt-4">
                  {challenges.length} selected
                </p>
              )}
            </div>
          )}

          {/* Step 2: Work Style */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg shadow-blue-500/20">
                  <span className="text-3xl">⚡</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">How do you prefer to work?</h2>
                <p className="text-zinc-500">This affects session length suggestions</p>
              </div>
              
              <div className="space-y-3">
                {WORK_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setWorkStyle(style.id)}
                    className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center gap-4 ${
                      workStyle === style.id
                        ? 'bg-zinc-800/50 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-3xl">{style.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-zinc-100">{style.label}</p>
                      <p className="text-sm text-zinc-500">{style.description}</p>
                    </div>
                    {workStyle === style.id && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Motivation Style */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/20">
                  <span className="text-3xl">🎙️</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">How should I talk to you?</h2>
                <p className="text-zinc-500">Pick your preferred coaching style</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {MOTIVATION_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setMotivationStyle(style.id)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      motivationStyle === style.id
                        ? 'bg-zinc-800/50 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{style.emoji}</span>
                      <p className="font-semibold text-zinc-100">{style.label}</p>
                      {motivationStyle === style.id && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ml-auto">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 italic">"{style.example.replace(/"/g, '')}"</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Goals & Context */}
          {step === 4 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-500/20">
                  <span className="text-3xl">🌟</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">What are you working toward?</h2>
                <p className="text-zinc-500">Optional but helps provide better context</p>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                    <span>🎯</span> Big Picture Goal
                  </label>
                  <input
                    type="text"
                    value={bigPictureGoal}
                    onChange={(e) => setBigPictureGoal(e.target.value)}
                    placeholder="e.g., Ship my SaaS by March, Get promoted"
                    className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                    <span>🔍</span> Current Focus
                  </label>
                  <input
                    type="text"
                    value={currentFocus}
                    onChange={(e) => setCurrentFocus(e.target.value)}
                    placeholder="e.g., Building the checkout flow, Learning TypeScript"
                    className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                    <span>💬</span> Anything else I should know?
                  </label>
                  <textarea
                    value={personalContext}
                    onChange={(e) => setPersonalContext(e.target.value)}
                    placeholder="e.g., I have ADHD and need structure, I'm a morning person..."
                    rows={3}
                    className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Summary */}
              {challenges.length > 0 && (
                <div className="mt-6 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                  <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Profile Summary</p>
                  <div className="flex flex-wrap gap-2">
                    {challenges.map(c => (
                      <span key={c} className="text-lg">{CHALLENGES.find(ch => ch.id === c)?.emoji}</span>
                    ))}
                    <span className="text-zinc-600 mx-1">•</span>
                    <span className="text-lg">{WORK_STYLES.find(s => s.id === workStyle)?.emoji}</span>
                    <span className="text-zinc-600 mx-1">•</span>
                    <span className="text-lg">{MOTIVATION_STYLES.find(s => s.id === motivationStyle)?.emoji}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-zinc-800/50">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : null}
            className={`flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors ${step === 1 ? 'invisible' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                canProceed
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving || challenges.length === 0}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
                !isSaving && challenges.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  {isOnboarding ? 'Get Started' : 'Save Profile'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
