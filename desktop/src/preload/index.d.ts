import { ElectronAPI } from '@electron-toolkit/preload'

interface SentinelAPI {
  enterLockdown: () => Promise<{ success: boolean }>
  exitLockdown: () => Promise<{ success: boolean }>
  emergencyUnlock: () => Promise<{ success: boolean; error?: string }>
  getLockedState: () => Promise<{ isLocked: boolean }>
  getDeviceId: () => Promise<{ deviceId: string }>
  isDevMode: () => Promise<{ isDev: boolean }>
  onEmergencyUnlock: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    sentinelAPI: SentinelAPI
  }
}
