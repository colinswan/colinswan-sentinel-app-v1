import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { TimerScreen } from './screens/Timer'
import { LockedScreen } from './screens/Locked'
import { SetupScreen } from './screens/Setup'
import { PairingScreen } from './screens/Pairing'
import { ProfileScreen } from './screens/Profile'
import { HealthScreen } from './screens/Health'
import { ProjectScreen } from './screens/Project'
import { CreateProjectScreen } from './screens/CreateProject'
import { QRGeneratorScreen } from './screens/QRGenerator'

type AppState = 'setup' | 'pairing' | 'onboarding' | 'timer' | 'locked' | 'profile' | 'health' | 'project' | 'create_project' | 'qr_generator'

function App(): JSX.Element {
  const [appState, setAppState] = useState<AppState>('setup')
  const [userId, setUserId] = useState<Id<'users'> | null>(null)
  const [deviceId, setDeviceId] = useState<Id<'devices'> | null>(null)
  const [isDevMode, setIsDevMode] = useState(false)
  const [startupGracePeriod, setStartupGracePeriod] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<Id<'projects'> | null>(null)

  const unlockDevice = useMutation(api.devices.unlock)
  
  // Check if user has completed onboarding
  const isOnboarded = useQuery(
    api.userProfiles.isOnboarded,
    userId ? { userId } : 'skip'
  )

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
      // Will check onboarding status below
      setAppState('timer')
    }
  }, [])

  // Check onboarding status when we have userId
  useEffect(() => {
    if (userId && isOnboarded === false && appState === 'timer') {
      // User hasn't completed onboarding yet
      setAppState('onboarding')
    }
  }, [userId, isOnboarded, appState])

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

    // Don't interrupt profile editing
    if (appState === 'profile' || appState === 'onboarding') {
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

  const handleSetupComplete = (newUserId: Id<'users'>, newDeviceId: Id<'devices'>) => {
    setUserId(newUserId)
    setDeviceId(newDeviceId)
    localStorage.setItem('sentinel_userId', newUserId)
    localStorage.setItem('sentinel_deviceId', newDeviceId)
    setAppState('pairing')
  }

  const handlePairingComplete = () => {
    // If user is already onboarded, go to timer; otherwise go to onboarding
    if (isOnboarded) {
      setAppState('timer')
    } else {
      setAppState('onboarding')
    }
  }

  const handleSkipPairing = () => {
    // If user is already onboarded, go to timer; otherwise go to onboarding
    if (isOnboarded) {
      setAppState('timer')
    } else {
      setAppState('onboarding')
    }
  }

  const handleOnboardingComplete = () => {
    setAppState('timer')
  }

  const handleOpenProfile = () => {
    setAppState('profile')
  }

  const handleProfileClose = () => {
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
      case 'setup':
        return <SetupScreen onComplete={handleSetupComplete} />
      case 'pairing':
        return (
          <PairingScreen
            deviceId={deviceId!}
            onComplete={handlePairingComplete}
            onSkip={handleSkipPairing}
          />
        )
      case 'onboarding':
        return (
          <ProfileScreen
            userId={userId!}
            onComplete={handleOnboardingComplete}
            isOnboarding={true}
          />
        )
      case 'profile':
        return (
          <ProfileScreen
            userId={userId!}
            onComplete={handleProfileClose}
            isOnboarding={false}
          />
        )
      case 'timer':
        return (
          <TimerScreen 
            userId={userId!} 
            deviceId={deviceId!}
            onOpenProfile={handleOpenProfile}
            onOpenHealth={handleOpenHealth}
            onOpenPairing={handleOpenPairing}
            onOpenQRGenerator={handleOpenQRGenerator}
            onOpenProject={handleOpenProject}
            onCreateProject={handleCreateProject}
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
        return <SetupScreen onComplete={handleSetupComplete} />
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
