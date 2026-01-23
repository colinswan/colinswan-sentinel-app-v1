import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { CoachPanel } from '../components/CoachPanel'
import { ProjectSelector } from '../components/ProjectSelector'

interface TimerScreenProps {
  userId: Id<'users'>
  deviceId: Id<'devices'>
  onOpenHealth?: () => void
  onOpenPairing?: () => void
  onOpenQRGenerator?: () => void
  onOpenProject?: (projectId: Id<'projects'>) => void
  onCreateProject?: () => void
  onOpenSettings?: () => void
}

type TimerState = 'idle' | 'pre-session' | 'running' | 'warning' | 'paused'

const DURATION_PRESETS = [
  { label: '15', mins: 15 },
  { label: '25', mins: 25 },
  { label: '50', mins: 50 },
  { label: '90', mins: 90 },
]

export function TimerScreen({ userId, deviceId, onOpenHealth, onOpenPairing, onOpenQRGenerator, onOpenProject, onCreateProject, onOpenSettings }: TimerScreenProps): JSX.Element {
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  
  // Pre-session state
  const [taskGoal, setTaskGoal] = useState('')
  const [isGettingAIHelp, setIsGettingAIHelp] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  
  // AI Coach panel state
  const [isCoachOpen, setIsCoachOpen] = useState(false)
  const [showCoachHint, setShowCoachHint] = useState(false)
  const coachHintShownRef = useRef(false)

  // Auto-start tracking
  const hasAutoStartedRef = useRef(false)
  const [showAutoStartNotice, setShowAutoStartNotice] = useState(false)

  // Pre-lock countdown tracking
  const countdownShownRef = useRef(false)

  const user = useQuery(api.users.get, { userId })
  const activeProject = useQuery(api.projects.getActive, { userId })
  const recentSessions = useQuery(api.sessions.listByUser, { userId, limit: 5 })
  const meetingModeStatus = useQuery(api.users.getMeetingModeStatus, { userId })
  const setupStatus = useQuery(api.devices.getSetupStatus, { userId })
  const startSession = useMutation(api.sessions.startSession)
  const lockDevice = useMutation(api.devices.lock)
  const heartbeat = useMutation(api.devices.heartbeat)
  const updateSettings = useMutation(api.users.updateSettings)
  const enableMeetingMode = useMutation(api.users.enableMeetingMode)
  const disableMeetingMode = useMutation(api.users.disableMeetingMode)
  const getTaskSuggestion = useAction(api.ai.suggestTask)

  // Meeting mode state for dropdown
  const [showMeetingModeMenu, setShowMeetingModeMenu] = useState(false)

  const workDurationMins = user?.workDurationMins ?? 50
  const workDurationSecs = workDurationMins * 60

  // Extract recent tasks for quick selection
  const recentTasks = recentSessions
    ?.filter(s => s.taskDescription && s.taskDescription.length > 5)
    .map(s => s.taskDescription!)
    .slice(0, 3) || []

  // Send heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      heartbeat({ deviceId }).catch(console.error)
    }, 30000)
    heartbeat({ deviceId }).catch(console.error)
    return () => clearInterval(interval)
  }, [deviceId, heartbeat])

  // Auto-start timer on app launch if enabled
  useEffect(() => {
    // Only run once, when user data is loaded and we're in idle state
    if (hasAutoStartedRef.current || !user || timerState !== 'idle') return

    // Check if auto-start is enabled (default to true for new users)
    const autoStartEnabled = user.autoStartTimer ?? true
    if (!autoStartEnabled) {
      hasAutoStartedRef.current = true // Mark as "handled" even if not starting
      return
    }

    // Auto-start the session
    hasAutoStartedRef.current = true
    const autoStartDuration = user.autoStartDurationMins ?? 60
    const autoStartDurationSecs = autoStartDuration * 60

    console.log(`🚀 Auto-starting ${autoStartDuration}m session`)

    // Start the session
    startSession({
      userId,
      deviceId,
      taskDescription: 'Auto-started session',
      projectId: activeProject?._id,
    })
      .then(() => {
        setTotalTime(autoStartDurationSecs)
        setTimeRemaining(autoStartDurationSecs)
        setTimerState('running')
        setShowAutoStartNotice(true)
        // Hide the notice after 5 seconds
        setTimeout(() => setShowAutoStartNotice(false), 5000)
      })
      .catch((error) => {
        console.error('Failed to auto-start session:', error)
      })
  }, [user, timerState, userId, deviceId, startSession, activeProject])

  // Timer countdown logic
  useEffect(() => {
    if (timerState !== 'running' && timerState !== 'warning') return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Check if meeting mode is active before locking
          if (meetingModeStatus?.isActive) {
            // Meeting mode active - don't lock, just reset timer
            console.log('Meeting mode active - skipping lock')
            countdownShownRef.current = false
            window.sentinelAPI?.hideCountdownOverlay?.()
            return 0
          }
          // Hide countdown overlay and lock
          window.sentinelAPI?.hideCountdownOverlay?.()
          lockDevice({ deviceId }).catch(console.error)
          setTimerState('idle')
          setTaskGoal('')
          countdownShownRef.current = false
          return 0
        }

        // Show pre-lock countdown overlay when we hit the threshold
        const countdownSecs = user?.preLockCountdownSecs ?? 10
        if (prev === countdownSecs && !countdownShownRef.current && !meetingModeStatus?.isActive) {
          countdownShownRef.current = true
          window.sentinelAPI?.showCountdownOverlay?.(countdownSecs)
        }

        if (prev <= 60 && timerState !== 'warning') {
          setTimerState('warning')
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState, deviceId, lockDevice, meetingModeStatus?.isActive])

  // Reset countdown ref when timer resets
  useEffect(() => {
    if (timerState === 'idle') {
      countdownShownRef.current = false
    }
  }, [timerState])

  // Show coach hint after 5 minutes
  useEffect(() => {
    if (timerState !== 'running' || coachHintShownRef.current) return
    const minutesElapsed = (totalTime - timeRemaining) / 60
    if (minutesElapsed >= 5 && minutesElapsed < 6) {
      coachHintShownRef.current = true
      setShowCoachHint(true)
      setTimeout(() => setShowCoachHint(false), 5000)
    }
  }, [timerState, totalTime, timeRemaining])

  useEffect(() => {
    if (timerState === 'idle') {
      coachHintShownRef.current = false
      setShowCoachHint(false)
    }
  }, [timerState])

  const handlePrepareSession = () => {
    setTimerState('pre-session')
    setAiSuggestion(null)
  }

  const handleAskAI = async () => {
    setIsGettingAIHelp(true)
    try {
      const suggestion = await getTaskSuggestion({ 
        userId,
        projectId: activeProject?._id,
      })
      setAiSuggestion(suggestion.task)
      setTaskGoal(suggestion.task)
    } catch (error) {
      console.error('Failed to get AI suggestion:', error)
    } finally {
      setIsGettingAIHelp(false)
    }
  }

  const handleStartSession = useCallback(async () => {
    try {
      await startSession({ 
        userId, 
        deviceId,
        taskDescription: taskGoal.trim() || undefined,
        projectId: activeProject?._id,
      })
      setTotalTime(workDurationSecs)
      setTimeRemaining(workDurationSecs)
      setTimerState('running')
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }, [userId, deviceId, workDurationSecs, startSession, taskGoal, activeProject])

  const handleSkipGoal = useCallback(async () => {
    setTaskGoal('')
    try {
      await startSession({ userId, deviceId, projectId: activeProject?._id })
      setTotalTime(workDurationSecs)
      setTimeRemaining(workDurationSecs)
      setTimerState('running')
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }, [userId, deviceId, workDurationSecs, startSession, activeProject])

  const handlePause = () => setTimerState('paused')
  const handleResume = () => setTimerState('running')
  const handleReset = () => {
    setTimerState('idle')
    setTimeRemaining(0)
    setTotalTime(0)
    setTaskGoal('')
  }

  const handleDurationChange = async (mins: number) => {
    try {
      await updateSettings({ userId, workDurationMins: mins })
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  // Meeting mode handlers
  const handleEnableMeetingMode = async (durationMins: number) => {
    try {
      await enableMeetingMode({ userId, durationMins })
      setShowMeetingModeMenu(false)
    } catch (error) {
      console.error('Failed to enable meeting mode:', error)
    }
  }

  const handleDisableMeetingMode = async () => {
    try {
      await disableMeetingMode({ userId })
    } catch (error) {
      console.error('Failed to disable meeting mode:', error)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const isWarning = timerState === 'warning'
  const isRunning = timerState === 'running' || timerState === 'warning'
  const isIdle = timerState === 'idle'

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  // Pre-session view
  if (timerState === 'pre-session') {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => setTimerState('idle')}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          
          {activeProject && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 rounded-full">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeProject.color }} />
              <span className="text-sm text-zinc-400">{activeProject.name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
          <div className="w-full max-w-md fade-in-up">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-4xl">🎯</span>
              </div>
            </div>

            {/* Greeting */}
            <h1 className="text-3xl font-bold text-center mb-2">
              <span className="text-zinc-100">{getGreeting()}</span>
              {user?.name && <span className="text-zinc-400">, {user.name.split(' ')[0]}</span>}
            </h1>
            
            <p className="text-zinc-500 text-center mb-8">
              What's the <span className="text-amber-400 font-semibold">one thing</span> you'll accomplish?
            </p>

            {/* Task Input */}
            <div className="relative mb-4">
              <textarea
                value={taskGoal}
                onChange={(e) => setTaskGoal(e.target.value)}
                placeholder="e.g., Finish the login component..."
                rows={3}
                className="w-full px-5 py-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 resize-none text-lg transition-all"
                autoFocus
              />
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && (
              <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl fade-in-up">
                <p className="text-xs text-amber-400 font-medium mb-1">✨ AI Suggestion</p>
                <p className="text-zinc-200">{aiSuggestion}</p>
              </div>
            )}

            {/* Quick Picks */}
            {(recentTasks.length > 0) && (
              <div className="mb-6">
                <p className="text-xs text-zinc-600 mb-2 uppercase tracking-wider">Recent tasks</p>
                <div className="flex flex-wrap gap-2">
                  {recentTasks.map((task, i) => (
                    <button
                      key={i}
                      onClick={() => setTaskGoal(task)}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-sm rounded-lg transition-all border border-zinc-800 hover:border-zinc-700"
                    >
                      {task.length > 35 ? task.slice(0, 35) + '...' : task}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Help me decide */}
            <button
              onClick={handleAskAI}
              disabled={isGettingAIHelp}
              className="w-full mb-6 py-3 text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 group"
            >
              {isGettingAIHelp ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>Help me decide</span>
                </>
              )}
            </button>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleStartSession}
                disabled={!taskGoal.trim()}
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                  taskGoal.trim()
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start {workDurationMins}m Session
              </button>

              <button
                onClick={handleSkipGoal}
                className="w-full py-3 text-zinc-500 hover:text-zinc-400 text-sm transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main timer view
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b]">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4">
        {/* Project Selector */}
        {isIdle && onOpenProject && onCreateProject ? (
          <ProjectSelector
            userId={userId}
            onOpenProject={onOpenProject}
            onCreateProject={onCreateProject}
          />
        ) : (
          <div className="w-32" />
        )}

        {/* Right Icons */}
        <div className="flex items-center gap-1">
          {/* Meeting Mode Button - always visible */}
          <div className="relative">
            {meetingModeStatus?.isActive ? (
              <button
                onClick={handleDisableMeetingMode}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/15 text-amber-400 rounded-xl hover:bg-amber-500/25 transition-all"
                title="Click to disable meeting mode"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {meetingModeStatus.remainingMins}m left
                </span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowMeetingModeMenu(!showMeetingModeMenu)}
                  className="p-2.5 text-zinc-500 hover:text-amber-400 hover:bg-zinc-900 rounded-xl transition-all"
                  title="Meeting Mode"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                {showMeetingModeMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-zinc-800">
                      <p className="text-xs text-zinc-500 font-medium px-2">MEETING MODE</p>
                    </div>
                    <div className="p-1">
                      {[30, 60, 120].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => handleEnableMeetingMode(mins)}
                          className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {mins < 60 ? `${mins} minutes` : `${mins / 60} hour${mins > 60 ? 's' : ''}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {isIdle && (
            <>
              {onOpenQRGenerator && (
                <button
                  onClick={onOpenQRGenerator}
                  className="p-2.5 text-zinc-500 hover:text-purple-400 hover:bg-zinc-900 rounded-xl transition-all"
                  title="Generate QR Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
              )}
              {onOpenPairing && (
                <button
                  onClick={onOpenPairing}
                  className="p-2.5 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900 rounded-xl transition-all"
                  title="Pair Mobile Device"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
              {onOpenHealth && (
                <button
                  onClick={onOpenHealth}
                  className="p-2.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900 rounded-xl transition-all"
                  title="Health Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              )}
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-2.5 rounded-xl transition-all text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>


      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Active Project Indicator */}
        {isRunning && activeProject && (
          <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-full fade-in-up">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeProject.color }} />
            <span className="text-sm text-zinc-400">{activeProject.name}</span>
          </div>
        )}

        {/* Timer Circle */}
        <div className={`relative ${isRunning ? 'breathe' : ''}`}>
          <svg width="320" height="320" className={isWarning ? 'timer-ring-warning' : 'timer-ring'}>
            {/* Background track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="#27272a"
              strokeWidth="6"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isWarning ? '#ef4444' : '#10b981'} />
                <stop offset="100%" stopColor={isWarning ? '#dc2626' : '#06b6d4'} />
              </linearGradient>
            </defs>
            {/* Progress arc */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 160 160)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Time Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-6xl font-light timer-display ${isWarning ? 'text-red-400' : 'text-zinc-100'}`}>
              {timerState === 'idle' ? formatTime(workDurationSecs) : formatTime(timeRemaining)}
            </span>
            <span className={`text-sm font-medium mt-2 ${
              isWarning ? 'text-red-400' : isRunning ? 'text-emerald-400' : 'text-zinc-500'
            }`}>
              {timerState === 'idle' && 'Ready to focus'}
              {timerState === 'running' && 'Focus time'}
              {timerState === 'warning' && '⚠️ Almost done!'}
              {timerState === 'paused' && 'Paused'}
            </span>
          </div>
        </div>

        {/* Current Task */}
        {isRunning && taskGoal && (
          <div className="mt-6 max-w-sm text-center fade-in-up">
            <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1">Working on</p>
            <p className="text-zinc-300">{taskGoal}</p>
          </div>
        )}

        {/* Duration Presets (idle) */}
        {isIdle && (
          <div className="flex gap-2 mt-8 fade-in-up">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.mins}
                onClick={() => handleDurationChange(preset.mins)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  workDurationMins === preset.mins
                    ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/50'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                {preset.label}m
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mt-8">
          {timerState === 'idle' && (
            <button
              onClick={handlePrepareSession}
              className="px-10 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start Session
            </button>
          )}

          {isRunning && (
            <>
              <button
                onClick={handlePause}
                className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                className="p-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}

          {timerState === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="px-8 py-4 rounded-2xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Resume
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-all"
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* User Info */}
        {isIdle && (
          <p className="mt-8 text-sm text-zinc-600">
            {user?.name}
          </p>
        )}

        {/* Setup Checklist - show when not fully setup */}
        {isIdle && setupStatus && !setupStatus.isFullySetup && (
          <div className="mt-8 w-full max-w-sm fade-in-up">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">📱</span>
                </div>
                <div>
                  <h3 className="text-amber-400 font-semibold">Complete your setup</h3>
                  <p className="text-amber-400/70 text-sm">Pair your phone to unlock after breaks</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-zinc-300 text-sm">Account created</span>
                </div>

                <div className="flex items-center gap-3">
                  {setupStatus.hasMobile ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-amber-500/50" />
                  )}
                  <span className={`text-sm ${setupStatus.hasMobile ? 'text-zinc-300' : 'text-amber-400'}`}>
                    Pair your phone {!setupStatus.hasMobile && '(required)'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-600" />
                  <span className="text-zinc-500 text-sm">Print QR checkpoint (optional)</span>
                </div>
              </div>

              {!setupStatus.hasMobile && onOpenPairing && (
                <button
                  onClick={onOpenPairing}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-xl transition-colors text-sm"
                >
                  Pair Phone Now
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auto-start Notice */}
      {showAutoStartNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 fade-in-up">
          <div className="bg-emerald-500/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">Session auto-started</span>
            <button
              onClick={() => setShowAutoStartNotice(false)}
              className="ml-2 hover:bg-white/20 p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Warning Banner */}
      {isWarning && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-500 py-4 text-center text-white font-medium shadow-lg shadow-red-500/30">
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Less than 1 minute! Prepare to move.
          </span>
        </div>
      )}

      {/* AI Coach Button */}
      {isRunning && (
        <div className="fixed bottom-8 right-8 z-30">
          {showCoachHint && !isCoachOpen && (
            <div className="absolute bottom-full right-0 mb-3 bounce-subtle">
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 shadow-lg whitespace-nowrap">
                <p className="text-sm text-zinc-200">Need help? I'm here! 👋</p>
              </div>
            </div>
          )}
          <button
            onClick={() => { setIsCoachOpen(true); setShowCoachHint(false) }}
            className={`w-14 h-14 rounded-2xl shadow-lg transition-all flex items-center justify-center ${
              showCoachHint
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 scale-110 shadow-amber-500/30'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:scale-105 shadow-amber-500/20 hover:shadow-amber-500/30'
            }`}
          >
            <span className="text-2xl">🤖</span>
          </button>
        </div>
      )}

      {/* AI Coach Panel */}
      <CoachPanel
        userId={userId}
        currentTask={taskGoal || undefined}
        minutesElapsed={Math.floor((totalTime - timeRemaining) / 60)}
        totalMinutes={Math.floor(totalTime / 60)}
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </div>
  )
}
