import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isLocked = false

// DEV MODE: Track if we should skip auto-lock on startup
const isDev = is.dev || process.env.NODE_ENV === 'development'

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    frame: true,
    resizable: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon)
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }))

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Sentinel',
      click: () => {
        mainWindow?.show()
      }
    },
    ...(isDev ? [{
      label: '🔧 DEV: Emergency Unlock',
      click: () => {
        emergencyUnlock()
      }
    }] : []),
    { type: 'separator' as const },
    {
      label: 'Quit',
      click: () => {
        if (!isLocked || isDev) {
          isLocked = false // Allow quit in dev
          app.quit()
        }
      }
    }
  ])

  tray.setToolTip('Sentinel' + (isDev ? ' (DEV)' : ''))
  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    mainWindow?.show()
  })
}

// EMERGENCY UNLOCK - Dev mode escape hatch
function emergencyUnlock(): void {
  console.log('🚨 EMERGENCY UNLOCK TRIGGERED')
  
  exitLockdown()
  
  // Notify renderer to reset state
  mainWindow?.webContents.send('emergency-unlock')
  
  // Show notification
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      console.log('Emergency unlock activated!');
    `)
  }
}

// Lockdown mode functions
function enterLockdown(): void {
  if (!mainWindow) return

  // DEV MODE: Show warning instead of full lockdown for first 5 seconds
  if (isDev) {
    console.log('⚠️  DEV MODE: Entering lockdown (Cmd+Shift+Escape to escape)')
  }

  isLocked = true

  // macOS-specific lockdown
  mainWindow.setKiosk(true)
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  mainWindow.setClosable(false)
  mainWindow.setMinimizable(false)
  mainWindow.setFullScreenable(false)

  // Hide dock icon on macOS to prevent escape via dock
  // In dev mode, keep dock visible for easier escape
  if (process.platform === 'darwin' && !isDev) {
    app.dock?.hide()
  }

  // Prevent window from being closed (except in dev mode with escape)
  mainWindow.on('close', (e) => {
    if (isLocked && !isDev) {
      e.preventDefault()
    }
  })

  mainWindow.show()
  mainWindow.focus()
}

function exitLockdown(): void {
  if (!mainWindow) return

  isLocked = false

  mainWindow.setKiosk(false)
  mainWindow.setAlwaysOnTop(false)
  mainWindow.setVisibleOnAllWorkspaces(false)
  mainWindow.setClosable(true)
  mainWindow.setMinimizable(true)
  mainWindow.setFullScreenable(true)

  // Show dock icon again on macOS
  if (process.platform === 'darwin') {
    app.dock?.show()
  }

  // Reset window size
  mainWindow.setSize(400, 600)
  mainWindow.center()
}

// IPC Handlers
ipcMain.handle('enter-lockdown', () => {
  enterLockdown()
  return { success: true }
})

ipcMain.handle('exit-lockdown', () => {
  exitLockdown()
  return { success: true }
})

ipcMain.handle('emergency-unlock', () => {
  if (isDev) {
    emergencyUnlock()
    return { success: true }
  }
  return { success: false, error: 'Not available in production' }
})

ipcMain.handle('get-locked-state', () => {
  return { isLocked }
})

ipcMain.handle('get-device-id', () => {
  // Use machine ID for persistent device identification
  const machineId = app.getPath('userData')
  return { deviceId: machineId }
})

ipcMain.handle('is-dev-mode', () => {
  return { isDev }
})

// App lifecycle
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.sentinel.desktop')

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // DEV MODE: Register emergency unlock hotkey
  if (isDev) {
    globalShortcut.register('CommandOrControl+Shift+Escape', () => {
      console.log('🚨 Emergency unlock hotkey pressed!')
      emergencyUnlock()
    })
    console.log('✅ DEV MODE: Emergency unlock hotkey registered (Cmd+Shift+Escape)')
  }

  createWindow()
  createTray()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Prevent quitting when locked (but allow in dev mode)
app.on('before-quit', (e) => {
  if (isLocked && !isDev) {
    e.preventDefault()
  }
})
