import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const sentinelAPI = {
  enterLockdown: (): Promise<{ success: boolean }> => ipcRenderer.invoke('enter-lockdown'),
  exitLockdown: (): Promise<{ success: boolean }> => ipcRenderer.invoke('exit-lockdown'),
  emergencyUnlock: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('emergency-unlock'),
  getLockedState: (): Promise<{ isLocked: boolean }> => ipcRenderer.invoke('get-locked-state'),
  getDeviceId: (): Promise<{ deviceId: string }> => ipcRenderer.invoke('get-device-id'),
  isDevMode: (): Promise<{ isDev: boolean }> => ipcRenderer.invoke('is-dev-mode'),
  
  // Listen for emergency unlock from main process
  onEmergencyUnlock: (callback: () => void) => {
    ipcRenderer.on('emergency-unlock', callback)
    return () => ipcRenderer.removeListener('emergency-unlock', callback)
  }
}

// Expose APIs to the renderer process
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('sentinelAPI', sentinelAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.sentinelAPI = sentinelAPI
}
