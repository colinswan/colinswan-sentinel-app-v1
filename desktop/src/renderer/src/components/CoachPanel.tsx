import { useState, useEffect, useCallback } from 'react'
import { useAction, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface CoachPanelProps {
  userId: Id<'users'>
  currentTask?: string
  minutesElapsed: number
  totalMinutes: number
  isOpen: boolean
  onClose: () => void
}

type HelpType =
  | 'procrastinating'
  | 'stuck'
  | 'doubting_myself'
  | 'overwhelmed'
  | 'lost_focus'
  | 'motivation'

interface HelpButton {
  label: string
  type: HelpType
  emoji: string
  gradient: string
}

const HELP_BUTTONS: HelpButton[] = [
  { label: 'Procrastinating', type: 'procrastinating', emoji: '🔥', gradient: 'from-orange-500 to-red-500' },
  { label: 'Stuck', type: 'stuck', emoji: '🧩', gradient: 'from-blue-500 to-cyan-500' },
  { label: 'Doubting Myself', type: 'doubting_myself', emoji: '💭', gradient: 'from-purple-500 to-pink-500' },
  { label: 'Overwhelmed', type: 'overwhelmed', emoji: '🌊', gradient: 'from-teal-500 to-emerald-500' },
  { label: 'Lost Focus', type: 'lost_focus', emoji: '🎯', gradient: 'from-amber-500 to-yellow-500' },
  { label: 'Motivation', type: 'motivation', emoji: '💪', gradient: 'from-green-500 to-lime-500' },
]

export function CoachPanel({ userId, currentTask, minutesElapsed, totalMinutes, isOpen, onClose }: CoachPanelProps): JSX.Element | null {
  const [selectedType, setSelectedType] = useState<HelpType | null>(null)
  const [response, setResponse] = useState<string | null>(null)
  const [context, setContext] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const getCoachingHelp = useAction(api.ai.getCoachingHelp)
  const profile = useQuery(api.userProfiles.get, { userId })
  const user = useQuery(api.users.get, { userId })

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedType(null)
        setResponse(null)
        setContext('')
        setIsLoading(false)
      }, 300)
    }
  }, [isOpen])

  const handleRequest = useCallback(async (type: HelpType, additionalContext: string = '') => {
    if (!userId) return
    setIsLoading(true)
    setResponse(null)

    try {
      const result = await getCoachingHelp({
        userId,
        helpType: type,
        currentTask,
        additionalContext: additionalContext || undefined,
      })
      setResponse(result.response)
      setContext('')
    } catch (error) {
      console.error('Coach request failed:', error)
      setResponse("I'm having trouble connecting. Take a breath and try again!")
    } finally {
      setIsLoading(false)
    }
  }, [userId, currentTask, getCoachingHelp])

  const handleHelpClick = (type: HelpType) => {
    setSelectedType(type)
    handleRequest(type)
  }

  const handleMoreHelp = () => {
    if (selectedType) {
      handleRequest(selectedType, context)
    }
  }

  const handleBack = () => {
    setSelectedType(null)
    setResponse(null)
    setContext('')
  }

  const firstName = user?.name?.split(' ')[0] || 'there'
  const motivationStyle = profile?.motivationStyle || 'encouraging'
  
  const getGreeting = () => {
    if (motivationStyle === 'tough_love') return `What's up, ${firstName}?`
    if (motivationStyle === 'analytical') return `How can I help, ${firstName}?`
    return `Hey ${firstName}! 👋`
  }

  const progressPercent = totalMinutes > 0 ? Math.round((minutesElapsed / totalMinutes) * 100) : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-96 max-h-[80vh] bg-zinc-900 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden scale-in">
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Sentinel Coach</h3>
                  <p className="text-xs text-zinc-500">{minutesElapsed}m into session</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Session Progress */}
            <div className="bg-zinc-800/50 rounded-xl p-3">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-zinc-500">Session Progress</span>
                <span className="text-zinc-400">{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {currentTask && (
                <p className="text-xs text-zinc-400 mt-2 truncate">
                  Working on: {currentTask}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2 max-h-[50vh] overflow-y-auto">
          {!selectedType ? (
            <div className="fade-in-up">
              <p className="text-zinc-300 mb-4">{getGreeting()}</p>
              <p className="text-sm text-zinc-500 mb-5">What can I help with?</p>
              
              <div className="grid grid-cols-2 gap-2">
                {HELP_BUTTONS.map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => handleHelpClick(btn.type)}
                    disabled={isLoading}
                    className="relative group p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-xl text-left transition-all disabled:opacity-50"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${btn.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity`} />
                    <div className="relative flex items-center gap-2">
                      <span className="text-xl">{btn.emoji}</span>
                      <span className="text-sm text-zinc-300 font-medium">{btn.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="fade-in-up">
              {/* Selected type header */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Different problem</span>
              </button>

              <div className="flex items-center gap-2 mb-4 p-3 bg-zinc-800/50 rounded-xl">
                <span className="text-xl">
                  {HELP_BUTTONS.find(b => b.type === selectedType)?.emoji}
                </span>
                <span className="text-zinc-200 font-medium">
                  {HELP_BUTTONS.find(b => b.type === selectedType)?.label}
                </span>
              </div>

              {/* Response */}
              {response && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl fade-in-up">
                  <p className="text-zinc-200 leading-relaxed">{response}</p>
                </div>
              )}

              {/* Loading */}
              {isLoading && (
                <div className="mb-4 p-4 bg-zinc-800/50 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="ml-2 text-zinc-400 text-sm">Thinking...</span>
                </div>
              )}

              {/* Additional context */}
              <div className="space-y-3">
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Add more context..."
                  rows={2}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-200 placeholder-zinc-600 text-sm resize-none focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={handleMoreHelp}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
                >
                  {isLoading ? 'Thinking...' : 'Get More Help'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800/50">
          <button
            onClick={onClose}
            className="w-full py-3 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors rounded-xl hover:bg-zinc-800/50"
          >
            Back to work
          </button>
        </div>
      </div>
    </div>
  )
}
