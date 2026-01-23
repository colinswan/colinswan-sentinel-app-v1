import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

interface SettingsScreenProps {
  userId: Id<'users'>
  deviceId: Id<'devices'>
  onBack: () => void
}

type SettingsSection =
  | 'timer'
  | 'smart_pause'
  | 'enforcement'
  | 'physical_challenge'
  | 'coaching'
  | 'appearance'
  | 'sounds'
  | 'shortcuts'
  | 'devices'
  | 'general'
  | 'about'

interface NavItem {
  id: SettingsSection
  label: string
  icon: JSX.Element
}

interface NavGroup {
  title: string
  items: NavItem[]
}

export function SettingsScreen({ userId, deviceId, onBack }: SettingsScreenProps): JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSection>('timer')

  const user = useQuery(api.users.get, { userId })
  const updateUser = useMutation(api.users.updateSettings)

  const navGroups: NavGroup[] = [
    {
      title: 'Sessions & Health',
      items: [
        {
          id: 'timer',
          label: 'Timer Settings',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          id: 'smart_pause',
          label: 'Smart Pause',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          id: 'enforcement',
          label: 'Enforcement Mode',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
        },
        {
          id: 'physical_challenge',
          label: 'Physical Challenge',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'AI Coach',
      items: [
        {
          id: 'coaching',
          label: 'Coaching Style',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Personalize',
      items: [
        {
          id: 'appearance',
          label: 'Appearance',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          ),
        },
        {
          id: 'sounds',
          label: 'Sound Effects',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ),
        },
        {
          id: 'shortcuts',
          label: 'Keyboard Shortcuts',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Devices',
      items: [
        {
          id: 'devices',
          label: 'Paired Devices',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Sentinel',
      items: [
        {
          id: 'general',
          label: 'General',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          id: 'about',
          label: 'About',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'timer':
        return <TimerSettingsSection user={user} onUpdate={(updates) => updateUser({ userId, ...updates })} />
      case 'smart_pause':
        return <SmartPauseSection userId={userId} />
      case 'enforcement':
        return <EnforcementSection userId={userId} />
      case 'physical_challenge':
        return <PhysicalChallengeSection userId={userId} />
      case 'coaching':
        return <CoachingSection userId={userId} />
      case 'appearance':
        return <AppearanceSection />
      case 'sounds':
        return <SoundsSection />
      case 'shortcuts':
        return <ShortcutsSection />
      case 'devices':
        return <DevicesSection deviceId={deviceId} />
      case 'general':
        return <GeneralSection userId={userId} />
      case 'about':
        return <AboutSection />
      default:
        return null
    }
  }

  const getSectionTitle = () => {
    for (const group of navGroups) {
      const item = group.items.find(i => i.id === activeSection)
      if (item) return item.label
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800/50 flex flex-col">
        {/* Back button */}
        <div className="p-4 border-b border-zinc-800/50">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        activeSection === item.id
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className={activeSection === item.id ? 'text-emerald-400' : ''}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-2xl">
          <h1 className="text-2xl font-bold text-zinc-100 mb-8">{getSectionTitle()}</h1>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Section Components
// ============================================================================

interface TimerSettingsSectionProps {
  user: { workDurationMins: number; breakDurationMins: number } | null | undefined
  onUpdate: (updates: { workDurationMins?: number; breakDurationMins?: number }) => void
}

function TimerSettingsSection({ user, onUpdate }: TimerSettingsSectionProps): JSX.Element {
  if (!user) {
    return <div className="text-zinc-500">Loading...</div>
  }

  return (
    <div className="space-y-8">
      {/* Work Duration */}
      <SettingsGroup title="Work Session">
        <SettingsRow
          label="Work duration"
          description="How long each focus session lasts"
        >
          <select
            value={user.workDurationMins}
            onChange={(e) => onUpdate({ workDurationMins: parseInt(e.target.value) })}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={25}>25 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={50}>50 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      {/* Break Duration */}
      <SettingsGroup title="Break">
        <SettingsRow
          label="Break duration"
          description="Minimum time before you can start the next session"
        >
          <select
            value={user.breakDurationMins}
            onChange={(e) => onUpdate({ breakDurationMins: parseInt(e.target.value) })}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
          </select>
        </SettingsRow>

        <SettingsRow
          label="Long breaks"
          description="Take a longer break every few sessions"
        >
          <span className="text-zinc-500 text-sm">Coming soon</span>
        </SettingsRow>
      </SettingsGroup>

      {/* Pre-Lock Countdown */}
      <SettingsGroup title="Pre-Lock Warning">
        <SettingsRow
          label="Countdown before lock"
          description="Show a warning before the screen locks"
        >
          <select
            defaultValue={10}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={0}>Disabled</option>
          </select>
        </SettingsRow>
      </SettingsGroup>
    </div>
  )
}

function SmartPauseSection({ userId }: { userId: Id<'users'> }): JSX.Element {
  const user = useQuery(api.users.get, { userId })
  const meetingModeStatus = useQuery(api.users.getMeetingModeStatus, { userId })
  const updateUser = useMutation(api.users.updateSettings)
  const enableMeetingMode = useMutation(api.users.enableMeetingMode)
  const disableMeetingMode = useMutation(api.users.disableMeetingMode)

  const handleToggle = async (field: 'smartPauseMic' | 'smartPauseScreenShare' | 'smartPauseTyping', value: boolean) => {
    try {
      await updateUser({ userId, [field]: value })
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const handleDefaultDurationChange = async (mins: number) => {
    try {
      await updateUser({ userId, defaultMeetingDurationMins: mins })
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Active Meeting Mode Banner */}
      {meetingModeStatus?.isActive && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-amber-400 font-medium">Meeting Mode Active</div>
              <div className="text-amber-400/70 text-sm">{meetingModeStatus.remainingMins} minutes remaining</div>
            </div>
          </div>
          <button
            onClick={() => disableMeetingMode({ userId })}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors"
          >
            End Now
          </button>
        </div>
      )}

      <SettingsGroup title="Automatic Pause">
        <SettingsRow
          label="Meetings or Calls"
          description="Pause timer when microphone is active"
        >
          <Toggle
            checked={user?.smartPauseMic ?? false}
            onChange={(checked) => handleToggle('smartPauseMic', checked)}
          />
        </SettingsRow>

        <SettingsRow
          label="Screen sharing"
          description="Pause timer when sharing your screen"
        >
          <Toggle
            checked={user?.smartPauseScreenShare ?? false}
            onChange={(checked) => handleToggle('smartPauseScreenShare', checked)}
          />
        </SettingsRow>

        <div className="bg-zinc-800/50 rounded-xl p-4 text-zinc-500 text-sm">
          Auto-detection of mic and screen sharing requires macOS accessibility permissions. Coming soon!
        </div>
      </SettingsGroup>

      <SettingsGroup title="Manual Pause">
        <SettingsRow
          label="Quick meeting mode"
          description="Instantly enable meeting mode"
        >
          <button
            onClick={() => enableMeetingMode({ userId })}
            disabled={meetingModeStatus?.isActive}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium rounded-lg text-sm transition-colors"
          >
            {meetingModeStatus?.isActive ? 'Active' : 'Enable'}
          </button>
        </SettingsRow>

        <SettingsRow
          label="Default meeting duration"
          description="How long meeting mode lasts"
        >
          <select
            value={user?.defaultMeetingDurationMins ?? 60}
            onChange={(e) => handleDefaultDurationChange(parseInt(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Typing Deferral">
        <SettingsRow
          label="Don't lock while typing"
          description="Delay lock if you're actively typing"
        >
          <Toggle
            checked={user?.smartPauseTyping ?? true}
            onChange={(checked) => handleToggle('smartPauseTyping', checked)}
          />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Idle Tracking">
        <SettingsRow
          label="Pause timer when idle"
          description="Pause after inactivity"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Reset timer when idle"
          description="Assume you took a natural break"
        >
          <div className="flex items-center gap-2">
            <Toggle defaultChecked={true} />
            <span className="text-zinc-400 text-sm">after</span>
            <select
              defaultValue={5}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
            >
              <option value={3}>3 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
            </select>
          </div>
        </SettingsRow>

        <div className="bg-zinc-800/50 rounded-xl p-4 text-zinc-500 text-sm">
          Idle tracking requires additional system permissions. Coming soon!
        </div>
      </SettingsGroup>
    </div>
  )
}

function EnforcementSection({ userId }: { userId: Id<'users'> }): JSX.Element {
  const user = useQuery(api.users.get, { userId })
  const updateUser = useMutation(api.users.updateSettings)
  const [mode, setMode] = useState<'casual' | 'balanced' | 'hardcore'>('balanced')

  const handleCountdownChange = async (secs: number) => {
    try {
      await updateUser({ userId, preLockCountdownSecs: secs })
    } catch (error) {
      console.error('Failed to update countdown:', error)
    }
  }

  const handleBreakDurationChange = async (mins: number) => {
    try {
      await updateUser({ userId, breakDurationMins: mins })
    } catch (error) {
      console.error('Failed to update break duration:', error)
    }
  }

  const handleEnforceBreakChange = async (checked: boolean) => {
    try {
      await updateUser({ userId, enforceBreakDuration: checked })
    } catch (error) {
      console.error('Failed to update break enforcement:', error)
    }
  }

  return (
    <div className="space-y-8">
      <SettingsGroup title="Pre-Lock Warning">
        <SettingsRow
          label="Countdown duration"
          description="Warning overlay before screen locks"
        >
          <select
            value={user?.preLockCountdownSecs ?? 10}
            onChange={(e) => handleCountdownChange(parseInt(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={15}>15 seconds</option>
            <option value={30}>30 seconds</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Break Enforcement">
        <SettingsRow
          label="Enforce break duration"
          description="Require rest period after unlocking"
        >
          <Toggle
            checked={user?.enforceBreakDuration ?? false}
            onChange={handleEnforceBreakChange}
          />
        </SettingsRow>

        <SettingsRow
          label="Break duration"
          description="Minimum rest time before next session"
        >
          <select
            value={user?.breakDurationMins ?? 10}
            onChange={(e) => handleBreakDurationChange(parseInt(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Break Skip Difficulty">
        <p className="text-zinc-400 text-sm mb-4">
          How difficult should it be to skip a break?
        </p>
        <div className="grid grid-cols-3 gap-4">
          <ModeCard
            title="Casual"
            description="Skip anytime"
            isSelected={mode === 'casual'}
            onClick={() => setMode('casual')}
            gradient="from-green-500/20 to-emerald-500/20"
          />
          <ModeCard
            title="Balanced"
            description="Skip after a pause"
            isSelected={mode === 'balanced'}
            onClick={() => setMode('balanced')}
            gradient="from-amber-500/20 to-orange-500/20"
          />
          <ModeCard
            title="Hardcore"
            description="No skips allowed"
            isSelected={mode === 'hardcore'}
            onClick={() => setMode('hardcore')}
            gradient="from-red-500/20 to-pink-500/20"
          />
        </div>
      </SettingsGroup>

      <SettingsGroup title="Emergency Override">
        <SettingsRow
          label="Emergency unlock"
          description="5 taps + confirmation phrase to unlock"
        >
          <Toggle defaultChecked={mode !== 'hardcore'} disabled={mode === 'hardcore'} />
        </SettingsRow>

        {mode === 'hardcore' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            Emergency override is disabled in Hardcore mode. You must complete the physical challenge to unlock.
          </div>
        )}
      </SettingsGroup>
    </div>
  )
}

function PhysicalChallengeSection({ userId }: { userId: Id<'users'> }): JSX.Element {
  const user = useQuery(api.users.get, { userId })
  const updateUser = useMutation(api.users.updateSettings)

  const handleRepsChange = async (reps: number) => {
    try {
      await updateUser({ userId, calfRaisesCount: reps })
    } catch (error) {
      console.error('Failed to update reps:', error)
    }
  }

  return (
    <div className="space-y-8">
      <SettingsGroup title="Required Exercise">
        <SettingsRow
          label="Enable physical challenge"
          description="Require exercise before unlocking"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Exercise type"
          description="What exercise to perform"
        >
          <select
            defaultValue="calf_raises"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value="calf_raises">Calf raises</option>
            <option value="squats">Squats</option>
            <option value="stretches">Stretches</option>
            <option value="walking">Walking (steps)</option>
          </select>
        </SettingsRow>

        <SettingsRow
          label="Repetitions"
          description="How many reps to complete"
        >
          <select
            value={user?.calfRaisesCount ?? 15}
            onChange={(e) => handleRepsChange(parseInt(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={10}>10 reps</option>
            <option value={15}>15 reps</option>
            <option value={20}>20 reps</option>
            <option value={25}>25 reps</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Verification">
        <SettingsRow
          label="Verification method"
          description="How to verify exercise completion"
        >
          <select
            defaultValue="checkbox"
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value="checkbox">Checkbox (honor system)</option>
            <option value="accelerometer">Accelerometer (coming soon)</option>
          </select>
        </SettingsRow>
      </SettingsGroup>

      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm">
        <strong>Why calf raises?</strong> For PTS/DVT prevention, active calf muscle contraction creates the "muscle pump" that helps blood return from your legs. Passive walking is less effective than targeted exercises.
      </div>
    </div>
  )
}

type Challenge = 'procrastination' | 'imposter_syndrome' | 'decision_paralysis' | 'perfectionism' | 'distraction' | 'overwork'
type WorkStyle = 'deep_focus' | 'pomodoro' | 'flexible'
type MotivationStyle = 'tough_love' | 'encouraging' | 'analytical' | 'collaborative'

const CHALLENGES: { id: Challenge; label: string; emoji: string; description: string }[] = [
  { id: 'procrastination', label: 'Procrastination', emoji: '⏰', description: 'Delaying tasks' },
  { id: 'imposter_syndrome', label: 'Imposter Syndrome', emoji: '🎭', description: 'Doubting skills' },
  { id: 'decision_paralysis', label: 'Decision Paralysis', emoji: '🤔', description: 'Hard to decide' },
  { id: 'perfectionism', label: 'Perfectionism', emoji: '✨', description: "Can't ship" },
  { id: 'distraction', label: 'Distraction', emoji: '📱', description: 'Easily pulled away' },
  { id: 'overwork', label: 'Overwork', emoji: '🔥', description: 'Forgetting breaks' },
]

const WORK_STYLES: { id: WorkStyle; label: string; description: string }[] = [
  { id: 'deep_focus', label: 'Deep Focus', description: 'Long blocks (90+ mins)' },
  { id: 'pomodoro', label: 'Pomodoro', description: 'Short bursts (25-50 mins)' },
  { id: 'flexible', label: 'Flexible', description: 'Varies by task' },
]

const MOTIVATION_STYLES: { id: MotivationStyle; label: string; desc: string }[] = [
  { id: 'tough_love', label: 'Tough Love', desc: 'Direct and challenging' },
  { id: 'encouraging', label: 'Encouraging', desc: 'Warm and supportive' },
  { id: 'analytical', label: 'Analytical', desc: 'Logical and framework-based' },
  { id: 'collaborative', label: 'Collaborative', desc: 'Partnership approach' },
]

function CoachingSection({ userId }: { userId: Id<'users'> }): JSX.Element {
  const profile = useQuery(api.userProfiles.get, { userId })
  const upsertProfile = useMutation(api.userProfiles.upsert)
  const updateMotivationStyle = useMutation(api.userProfiles.updateMotivationStyle)

  // Local state for profile fields
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [workStyle, setWorkStyle] = useState<WorkStyle>('pomodoro')
  const [motivationStyle, setMotivationStyle] = useState<MotivationStyle>('encouraging')
  const [bigPictureGoal, setBigPictureGoal] = useState('')
  const [currentFocus, setCurrentFocus] = useState('')
  const [personalContext, setPersonalContext] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      setChallenges(profile.challenges as Challenge[])
      setWorkStyle(profile.workStyle as WorkStyle)
      setMotivationStyle(profile.motivationStyle as MotivationStyle)
      setBigPictureGoal(profile.bigPictureGoal || '')
      setCurrentFocus(profile.currentFocus || '')
      setPersonalContext(profile.personalContext || '')
    }
  }, [profile])

  const toggleChallenge = (challenge: Challenge) => {
    setChallenges(prev => {
      const newChallenges = prev.includes(challenge)
        ? prev.filter(c => c !== challenge)
        : [...prev, challenge]
      setHasUnsavedChanges(true)
      return newChallenges
    })
  }

  const handleWorkStyleChange = (style: WorkStyle) => {
    setWorkStyle(style)
    setHasUnsavedChanges(true)
  }

  const handleMotivationStyleChange = async (style: MotivationStyle) => {
    setMotivationStyle(style)
    if (profile) {
      try {
        await updateMotivationStyle({ userId, motivationStyle: style })
      } catch (error) {
        console.error('Failed to update motivation style:', error)
      }
    } else {
      setHasUnsavedChanges(true)
    }
  }

  const handleGoalsChange = (field: 'bigPictureGoal' | 'currentFocus' | 'personalContext', value: string) => {
    if (field === 'bigPictureGoal') setBigPictureGoal(value)
    else if (field === 'currentFocus') setCurrentFocus(value)
    else setPersonalContext(value)
    setHasUnsavedChanges(true)
  }

  const handleSaveProfile = async () => {
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
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const hasProfile = !!profile

  return (
    <div className="space-y-8">
      {/* Setup prompt for new users */}
      {!hasProfile && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-400 text-sm">
            <strong>Personalize your AI coach</strong> - Set up your profile to get tailored advice and motivation during your sessions.
          </p>
        </div>
      )}

      {/* Challenges */}
      <SettingsGroup title="What do you struggle with?">
        <p className="text-zinc-400 text-sm mb-4">
          Select all that apply - helps tailor AI coaching
        </p>
        <div className="grid grid-cols-2 gap-2">
          {CHALLENGES.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => toggleChallenge(challenge.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                challenges.includes(challenge.id)
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              <span className="text-xl">{challenge.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-zinc-200 text-sm font-medium">{challenge.label}</div>
                <div className="text-zinc-500 text-xs truncate">{challenge.description}</div>
              </div>
              {challenges.includes(challenge.id) && (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </SettingsGroup>

      {/* Work Style */}
      <SettingsGroup title="Preferred work style">
        <div className="space-y-2">
          {WORK_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => handleWorkStyleChange(style.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                workStyle === style.id
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                workStyle === style.id
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-zinc-500'
              }`}>
                {workStyle === style.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <div className="text-zinc-200 font-medium">{style.label}</div>
                <div className="text-zinc-500 text-sm">{style.description}</div>
              </div>
            </button>
          ))}
        </div>
      </SettingsGroup>

      {/* Motivation Style */}
      <SettingsGroup title="Coaching tone">
        <p className="text-zinc-400 text-sm mb-4">
          How should the AI coach communicate with you?
        </p>
        <div className="space-y-2">
          {MOTIVATION_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => handleMotivationStyleChange(style.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                motivationStyle === style.id
                  ? 'bg-emerald-500/10 border-emerald-500/50'
                  : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                motivationStyle === style.id
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-zinc-500'
              }`}>
                {motivationStyle === style.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <div className="text-zinc-200 font-medium">{style.label}</div>
                <div className="text-zinc-500 text-sm">{style.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </SettingsGroup>

      {/* Goals & Context */}
      <SettingsGroup title="Goals & Context">
        <p className="text-zinc-400 text-sm mb-4">
          Help the AI understand your situation (optional)
        </p>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Big picture goal</label>
            <input
              type="text"
              value={bigPictureGoal}
              onChange={(e) => handleGoalsChange('bigPictureGoal', e.target.value)}
              placeholder="e.g., Ship my SaaS by March"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Current focus</label>
            <input
              type="text"
              value={currentFocus}
              onChange={(e) => handleGoalsChange('currentFocus', e.target.value)}
              placeholder="e.g., Building the checkout flow"
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Personal context</label>
            <textarea
              value={personalContext}
              onChange={(e) => handleGoalsChange('personalContext', e.target.value)}
              placeholder="e.g., I have ADHD and need structure..."
              rows={2}
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 text-sm resize-none"
            />
          </div>
        </div>
      </SettingsGroup>

      {/* Save Button */}
      {(hasUnsavedChanges || !hasProfile) && challenges.length > 0 && (
        <div className="pt-4">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || challenges.length === 0}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
              hasProfile ? 'Save Changes' : 'Save Profile'
            )}
          </button>
        </div>
      )}

      {/* Proactive Check-ins */}
      <SettingsGroup title="Proactive Check-ins">
        <SettingsRow
          label="Mid-session check-ins"
          description="AI checks in during long sessions"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Check-in frequency"
          description="How often to check in during session"
        >
          <select
            defaultValue={20}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={15}>Every 15 minutes</option>
            <option value={20}>Every 20 minutes</option>
            <option value={30}>Every 30 minutes</option>
          </select>
        </SettingsRow>
      </SettingsGroup>
    </div>
  )
}

function AppearanceSection(): JSX.Element {
  const [lockScreenStyle, setLockScreenStyle] = useState<'blur' | 'gradient' | 'black'>('blur')

  return (
    <div className="space-y-8">
      <SettingsGroup title="Lock Screen">
        <p className="text-zinc-400 text-sm mb-4">
          What to show when the screen locks
        </p>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setLockScreenStyle('blur')}
            className={`relative aspect-video rounded-xl border-2 overflow-hidden transition-all ${
              lockScreenStyle === 'blur' ? 'border-emerald-500' : 'border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-zinc-600 to-zinc-800 blur-sm" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-zinc-300 font-medium">Blur</span>
            </div>
          </button>
          <button
            onClick={() => setLockScreenStyle('gradient')}
            className={`relative aspect-video rounded-xl border-2 overflow-hidden transition-all ${
              lockScreenStyle === 'gradient' ? 'border-emerald-500' : 'border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-pink-500/30 to-purple-500/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-zinc-300 font-medium">Gradient</span>
            </div>
          </button>
          <button
            onClick={() => setLockScreenStyle('black')}
            className={`relative aspect-video rounded-xl border-2 overflow-hidden transition-all ${
              lockScreenStyle === 'black' ? 'border-emerald-500' : 'border-zinc-700 hover:border-zinc-600'
            }`}
          >
            <div className="w-full h-full bg-black" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-zinc-300 font-medium">Black</span>
            </div>
          </button>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Lock Screen Content">
        <SettingsRow
          label="Show session stats"
          description="Display task name and time worked"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Show QR code"
          description="Display QR code on lock screen"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Custom messages"
          description="Show motivational messages"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>
      </SettingsGroup>
    </div>
  )
}

function SoundsSection(): JSX.Element {
  return (
    <div className="space-y-8">
      <SettingsGroup title="Break Sounds">
        <SettingsRow
          label="Play on break start"
          description="Sound when session ends"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Play on break end"
          description="Sound when break is complete"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Alerts">
        <SettingsRow
          label="Pre-lock countdown sound"
          description="Sound during countdown"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <SettingsRow
          label="Overtime nudge sound"
          description="Sound when working past break time"
        >
          <Toggle defaultChecked={false} />
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Volume">
        <div className="flex items-center gap-4">
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={70}
            className="flex-1 h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer"
          />
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </div>
      </SettingsGroup>
    </div>
  )
}

function ShortcutsSection(): JSX.Element {
  return (
    <div className="space-y-8">
      <SettingsGroup title="General">
        <ShortcutRow label="Start session" shortcut="Coming soon" />
        <ShortcutRow label="Pause timer" shortcut="Coming soon" />
        <ShortcutRow label="Meeting mode" shortcut="Coming soon" />
      </SettingsGroup>

      <SettingsGroup title="Break">
        <ShortcutRow label="Start break immediately" shortcut="Coming soon" />
        <ShortcutRow label="Emergency unlock" shortcut="Cmd+Shift+Escape" />
      </SettingsGroup>
    </div>
  )
}

function ShortcutRow({ label, shortcut }: { label: string; shortcut: string }): JSX.Element {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-zinc-300">{label}</span>
      <button className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 text-sm hover:bg-zinc-700 transition-colors">
        {shortcut}
      </button>
    </div>
  )
}

function DevicesSection({ deviceId }: { deviceId: Id<'devices'> }): JSX.Element {
  const deviceStatus = useQuery(api.devices.getStatus, { deviceId })

  return (
    <div className="space-y-8">
      <SettingsGroup title="This Device">
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="text-zinc-200 font-medium">Desktop</div>
              <div className="text-zinc-500 text-sm">Status: {deviceStatus || 'Unknown'}</div>
            </div>
            <div className={`w-3 h-3 rounded-full ${deviceStatus === 'unlocked' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Paired Mobile Devices">
        <p className="text-zinc-400 text-sm mb-4">
          Pair your phone to scan QR codes and unlock your desktop.
        </p>
        <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors">
          Pair a new device
        </button>
      </SettingsGroup>

      <SettingsGroup title="QR Checkpoint">
        <p className="text-zinc-400 text-sm mb-4">
          Generate a QR code to print and place at your checkpoint location (e.g., kitchen, hallway).
        </p>
        <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-xl border border-zinc-700 transition-colors">
          Generate QR Code
        </button>
      </SettingsGroup>
    </div>
  )
}

function GeneralSection({ userId }: { userId: Id<'users'> }): JSX.Element {
  const user = useQuery(api.users.get, { userId })
  const updateUser = useMutation(api.users.updateSettings)

  const handleToggle = async (field: 'autoStartTimer' | 'launchAtLogin', value: boolean) => {
    try {
      await updateUser({ userId, [field]: value })

      // If toggling launchAtLogin, also update the system setting
      if (field === 'launchAtLogin') {
        // This will be handled by the main process
        window.sentinelAPI?.setLaunchAtLogin?.(value)
      }
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  const handleDurationChange = async (mins: number) => {
    try {
      await updateUser({ userId, autoStartDurationMins: mins })
    } catch (error) {
      console.error('Failed to update setting:', error)
    }
  }

  return (
    <div className="space-y-8">
      <SettingsGroup title="Startup">
        <SettingsRow
          label="Launch at login"
          description="Start Sentinel when you log in"
        >
          <Toggle
            checked={user?.launchAtLogin ?? true}
            onChange={(checked) => handleToggle('launchAtLogin', checked)}
          />
        </SettingsRow>

        <SettingsRow
          label="Auto-start timer"
          description="Automatically start session when app opens"
        >
          <Toggle
            checked={user?.autoStartTimer ?? true}
            onChange={(checked) => handleToggle('autoStartTimer', checked)}
          />
        </SettingsRow>

        <SettingsRow
          label="Auto-start duration"
          description="Session length when auto-started"
        >
          <select
            value={user?.autoStartDurationMins ?? 60}
            onChange={(e) => handleDurationChange(parseInt(e.target.value))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-emerald-500/50"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </SettingsRow>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm">
          <strong>Passive mode:</strong> With these enabled, Sentinel will automatically enforce breaks - you don't need to manually start sessions.
        </div>
      </SettingsGroup>

      <SettingsGroup title="Updates">
        <SettingsRow
          label="Automatically check for updates"
          description="Check for new versions"
        >
          <Toggle defaultChecked={true} />
        </SettingsRow>

        <div className="flex items-center justify-between py-3">
          <div>
            <div className="text-zinc-300">Current version</div>
            <div className="text-zinc-500 text-sm">1.0.0</div>
          </div>
          <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors">
            Check for updates
          </button>
        </div>
      </SettingsGroup>
    </div>
  )
}

function AboutSection(): JSX.Element {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-zinc-100">Sentinel</h2>
        <p className="text-zinc-500 mt-1">Version 1.0.0</p>
        <p className="text-zinc-400 text-sm mt-4 max-w-sm mx-auto">
          Your guardian for health and productivity. Enforced breaks with AI coaching.
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors">
          Visit Website
        </button>
        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-sm transition-colors">
          Report Issue
        </button>
      </div>

      <div className="text-center text-zinc-600 text-sm">
        Made with care for your health
      </div>
    </div>
  )
}

// ============================================================================
// Reusable Components
// ============================================================================

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
      <div className="flex-1 mr-4">
        <div className="text-zinc-200">{label}</div>
        {description && <div className="text-zinc-500 text-sm">{description}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({
  defaultChecked = false,
  checked: controlledChecked,
  onChange,
  disabled = false
}: {
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}): JSX.Element {
  const [internalChecked, setInternalChecked] = useState(defaultChecked)

  // Use controlled value if provided, otherwise use internal state
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked

  const handleClick = () => {
    if (disabled) return
    const newValue = !isChecked
    if (onChange) {
      onChange(newValue)
    } else {
      setInternalChecked(newValue)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${isChecked ? 'bg-emerald-500' : 'bg-zinc-700'}`}
    >
      <div
        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
          isChecked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function ModeCard({
  title,
  description,
  isSelected,
  onClick,
  gradient,
}: {
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
  gradient: string
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? 'border-emerald-500 bg-gradient-to-br ' + gradient
          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
      }`}
    >
      <div className="text-zinc-200 font-semibold">{title}</div>
      <div className="text-zinc-400 text-sm mt-1">{description}</div>
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  )
}
