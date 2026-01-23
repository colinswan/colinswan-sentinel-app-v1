import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { TimerScreen } from './screens/Timer'
import { LockedScreen } from './screens/Locked'
import { WelcomeScreen } from './screens/Welcome'
import { PairingScreen } from './screens/Pairing'
import { HealthScreen } from './screens/Health'
import { ProjectScreen } from './screens/Project'
import { CreateProjectScreen } from './screens/CreateProject'
import { QRGeneratorScreen } from './screens/QRGenerator'
import { SettingsScreen } from './screens/Settings'

type AppState = 'welcome' | 'pairing' | 'timer' | 'locked' | 'health' | 'project' | 'create_project' | 'qr_generator' | 'settings'

function App(): JSX.Element {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [deviceId, setDeviceId] = useState<Id<'devices'> | null>(null)
  const [isDevMode, setIsDevMode] = useState(false)
  const [startupGracePeriod, setStartupGracePeriod] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<Id<'projects'> | null>(null)

  const unlockDevice = useMutation(api.devices.unlock)

  // Check if we're in dev mode
  useEffect(() => {
    window.sentinelAPI.isDevMode().then(({ isDev }) => {
      setIsDevMode(isDev)
      if (isDev) {
        console.log('🔧 DEV MODE: Emergency unlock available (Cmd+Shift+Escape)')
      }
    })
  }, [])

  // Dev mode: Grace period on startup to prevent immediate lockdown
  useEffect(() => {
    if (isDevMode) {
      const timer = setTimeout(() => {
        setStartupGracePeriod(false)
        console.log('✅ Startup grace period ended')
      }, 3000) // 3 second grace period
      return () => clearTimeout(timer)
    } else {
      setStartupGracePeriod(false)
    }
  }, [isDevMode])

  // Listen for emergency unlock from main process
  useEffect(() => {
    const cleanup = window.sentinelAPI.onEmergencyUnlock(() => {
      console.log('🚨 Emergency unlock received!')
      setAppState('timer')
      
      // Also unlock in Convex if we have a device
      if (deviceId) {
        unlockDevice({ deviceId }).catch(console.error)
      }
    })
    return cleanup
  }, [deviceId, unlockDevice])

  // Load saved IDs from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem('sentinel_userId')
    const savedDeviceId = localStorage.getItem('sentinel_deviceId')

    if (savedUserId && savedDeviceId) {
      setUserId(savedUserId as Id<'users'>)
      setDeviceId(savedDeviceId as Id<'devices'>)
      setAppState('timer')
    }
  }, [])

  // Subscribe to device lock info (status + message)
  const lockInfo = useQuery(
    api.devices.getLockInfo,
    deviceId ? { deviceId } : 'skip'
  )

  // Handle lock state changes
  useEffect(() => {
    // Skip during startup grace period in dev mode
    if (startupGracePeriod && isDevMode) {
      console.log('⏳ Startup grace period - skipping auto-lock')
      return
    }

    // Don't interrupt settings editing
    if (appState === 'settings') {
      return
    }

    if (lockInfo?.status === 'locked' && appState !== 'locked') {
      setAppState('locked')
      window.sentinelAPI.enterLockdown()
    } else if (lockInfo?.status === 'unlocked' && appState === 'locked') {
      setAppState('timer')
      window.sentinelAPI.exitLockdown()
    }
  }, [lockInfo?.status, appState, startupGracePeriod, isDevMode])

  // Add/remove locked class on body for scroll control
  useEffect(() => {
    if (appState === 'locked') {
      document.body.classList.add('locked')
    } else {
      document.body.classList.remove('locked')
    }
  }, [appState])

  const handleWelcomeComplete = (newUserId: Id<'users'>, newDeviceId: Id<'devices'>) => {
    setUserId(newUserId)
    setDeviceId(newDeviceId)
    localStorage.setItem('sentinel_userId', newUserId)
    localStorage.setItem('sentinel_deviceId', newDeviceId)
    // Go directly to timer - we'll introduce pairing and profile later
    setAppState('timer')
  }

  const handlePairingComplete = () => {
    setAppState('timer')
  }

  const handleSkipPairing = () => {
    setAppState('timer')
  }

  const handleOpenHealth = () => {
    setAppState('health')
  }

  const handleHealthClose = () => {
    setAppState('timer')
  }

  const handleOpenPairing = () => {
    setAppState('pairing')
  }

  const handleOpenQRGenerator = () => {
    setAppState('qr_generator')
  }

  const handleOpenProject = (projectId: Id<'projects'>) => {
    setSelectedProjectId(projectId)
    setAppState('project')
  }

  const handleCreateProject = () => {
    setAppState('create_project')
  }

  const handleProjectComplete = () => {
    setSelectedProjectId(null)
    setAppState('timer')
  }

  const handleProjectCreated = (_projectId: Id<'projects'>) => {
    setAppState('timer')
  }

  const handleOpenSettings = () => {
    setAppState('settings')
  }

  const handleSettingsClose = () => {
    setAppState('timer')
  }

  // Dev mode banner component
  const DevModeBanner = () => {
    if (!isDevMode) return null
    return (
      <div className="fixed top-0 left-0 right-0 bg-amber-600 text-black text-xs py-1 px-2 text-center z-50 flex items-center justify-center gap-2">
        <span>🔧 DEV MODE</span>
        <span className="opacity-75">|</span>
        <span>Cmd+Shift+Escape to emergency unlock</span>
        {startupGracePeriod && (
          <>
            <span className="opacity-75">|</span>
            <span className="animate-pulse">Grace period active...</span>
          </>
        )}
      </div>
    )
  }

  // Render the appropriate screen
  const renderScreen = () => {
    switch (appState) {
      case 'welcome':
        return <WelcomeScreen onComplete={handleWelcomeComplete} />
      case 'pairing':
        return (
          <PairingScreen
            deviceId={deviceId!}
            onComplete={handlePairingComplete}
            onSkip={handleSkipPairing}
          />
        )
      case 'timer':
        return (
          <TimerScreen
            userId={userId!}
            deviceId={deviceId!}
            onOpenHealth={handleOpenHealth}
            onOpenPairing={handleOpenPairing}
            onOpenQRGenerator={handleOpenQRGenerator}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
            onOpenSettings={handleOpenSettings}
          />
        )
      case 'health':
        return (
          <HealthScreen
            userId={userId!}
            onBack={handleHealthClose}
          />
        )
      case 'project':
        return (
          <ProjectScreen
            projectId={selectedProjectId!}
            userId={userId!}
            onBack={handleProjectComplete}
          />
        )
      case 'create_project':
        return (
          <CreateProjectScreen
            userId={userId!}
            onComplete={handleProjectCreated}
            onCancel={() => setAppState('timer')}
          />
        )
      case 'qr_generator':
        return (
          <QRGeneratorScreen
            onBack={() => setAppState('timer')}
          />
        )
      case 'settings':
        return (
          <SettingsScreen
            userId={userId!}
            deviceId={deviceId!}
            onBack={handleSettingsClose}
          />
        )
      case 'locked':
        return (
          <LockedScreen
            isDevMode={isDevMode}
            lockMessage={lockInfo?.lockMessage}
            currentTask={lockInfo?.currentTask}
            deviceId={deviceId ?? undefined}
          />
        )
      default:
        return <WelcomeScreen onComplete={handleWelcomeComplete} />
    }
  }

  return (
    <>
      <DevModeBanner />
      <div className={isDevMode ? 'pt-6' : ''}>
        {renderScreen()}
      </div>
    </>
  )
}

export default App
