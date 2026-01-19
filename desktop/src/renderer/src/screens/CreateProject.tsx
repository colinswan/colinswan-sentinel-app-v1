import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface CreateProjectScreenProps {
  userId: Id<'users'>
  onComplete: (projectId: Id<'projects'>) => void
  onCancel: () => void
}

type CoachingMode = 'ship_fast' | 'learning' | 'maintenance' | 'creative' | 'default'
type CoachingIntensity = 'low' | 'medium' | 'high'

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
]

const EMOJIS = ['🚀', '💡', '🎯', '⚡', '🔥', '💪', '🌟', '🎨', '📱', '💻', '🔧', '📚']

const COACHING_MODES: { value: CoachingMode; label: string; emoji: string; desc: string; gradient: string }[] = [
  { value: 'ship_fast', label: 'Ship Fast', emoji: '🚀', desc: 'High urgency, focus on shipping', gradient: 'from-red-500 to-orange-500' },
  { value: 'learning', label: 'Learning', emoji: '📚', desc: 'Patient, celebrate understanding', gradient: 'from-blue-500 to-cyan-500' },
  { value: 'creative', label: 'Creative', emoji: '🎨', desc: 'Exploratory, open-ended', gradient: 'from-purple-500 to-pink-500' },
  { value: 'maintenance', label: 'Maintenance', emoji: '🔧', desc: 'Steady, no pressure', gradient: 'from-zinc-500 to-zinc-600' },
  { value: 'default', label: 'Default', emoji: '⚙️', desc: 'Use your profile settings', gradient: 'from-emerald-500 to-green-500' },
]

export function CreateProjectScreen({ userId, onComplete, onCancel }: CreateProjectScreenProps): JSX.Element {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [coachingMode, setCoachingMode] = useState<CoachingMode>('default')
  const [coachingIntensity, setCoachingIntensity] = useState<CoachingIntensity>('medium')
  const [color, setColor] = useState(COLORS[0])
  const [emoji, setEmoji] = useState<string | undefined>()
  const [isCreating, setIsCreating] = useState(false)

  const createProject = useMutation(api.projects.create)

  const handleCreate = async () => {
    if (!name.trim()) return
    
    setIsCreating(true)
    try {
      const projectId = await createProject({
        userId,
        name: name.trim(),
        goal: goal.trim() || undefined,
        coachingMode,
        coachingIntensity,
        color,
        emoji,
        setAsActive: true,
      })
      
      onComplete(projectId)
    } catch (error) {
      console.error('Failed to create project:', error)
      setIsCreating(false)
    }
  }

  const canProceed = step === 1 ? name.trim().length > 0 : true

  const STEP_ICONS = ['📁', '🎙️', '🎨']

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm">Cancel</span>
          </button>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => s <= step ? setStep(s) : null}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                  step === s
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : s < step
                    ? 'text-emerald-500/50 hover:text-emerald-400 cursor-pointer'
                    : 'text-zinc-600 cursor-default'
                }`}
              >
                <span>{STEP_ICONS[s - 1]}</span>
                {step === s && <span className="font-medium">{s === 1 ? 'Basics' : s === 2 ? 'Coaching' : 'Visual'}</span>}
              </button>
            ))}
          </div>

          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-lg fade-in-up">
          
          {/* Step 1: Name & Goal */}
          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-4 shadow-lg shadow-emerald-500/20">
                  <span className="text-3xl">📁</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 mb-2">Create a Project</h1>
                <p className="text-zinc-500">Projects help you organize work and track progress</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                    Project Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sentinel App, Client Website, Learning Rust"
                    className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all text-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                    What's the big goal? <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Ship MVP by March, Learn fundamentals"
                    className="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Coaching Mode */}
          {step === 2 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/20">
                  <span className="text-3xl">🎙️</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 mb-2">How should I coach you?</h1>
                <p className="text-zinc-500">Different projects need different energy</p>
              </div>

              <div className="space-y-3 mb-6">
                {COACHING_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setCoachingMode(mode.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      coachingMode === mode.value
                        ? 'border-emerald-500/50 bg-zinc-800/50 shadow-lg shadow-emerald-500/10'
                        : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl">{mode.emoji}</span>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-semibold text-zinc-100">{mode.label}</p>
                      <p className="text-sm text-zinc-500">{mode.desc}</p>
                    </div>
                    {coachingMode === mode.value && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Intensity */}
              <div className="pt-6 border-t border-zinc-800/50">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Coaching intensity
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as CoachingIntensity[]).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => setCoachingIntensity(intensity)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        coachingIntensity === intensity
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 border border-zinc-800'
                      }`}
                    >
                      {intensity === 'low' ? '😌 Gentle' : intensity === 'medium' ? '💪 Balanced' : '🔥 Push Hard'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Visual */}
          {step === 3 && (
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-lg shadow-amber-500/20">
                  <span className="text-3xl">🎨</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 mb-2">Make it yours</h1>
                <p className="text-zinc-500">Pick a color and emoji</p>
              </div>

              {/* Preview */}
              <div className="flex items-center justify-center gap-3 py-6 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 mb-6">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: color }} />
                <span className="text-2xl">{emoji || '📁'}</span>
                <span className="text-xl font-semibold text-zinc-100">{name}</span>
              </div>

              {/* Colors */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-12 h-12 rounded-xl transition-all hover:scale-110 ${
                        color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b] scale-110' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Emojis */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Emoji (optional)</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setEmoji(undefined)}
                    className={`w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-sm text-zinc-400 transition-all hover:border-zinc-600 ${
                      !emoji ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b]' : ''
                    }`}
                  >
                    ✕
                  </button>
                  {EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-12 h-12 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-xl transition-all hover:border-zinc-600 hover:scale-110 ${
                        emoji === e ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0b] scale-110' : ''
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-zinc-800/50">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : null}
            className={`flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors ${step === 1 ? 'invisible' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          {step < 3 ? (
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
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  Create Project
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
