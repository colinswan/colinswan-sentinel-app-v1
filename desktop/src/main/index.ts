import { app, shell, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let overlayWindows: BrowserWindow[] = []
let countdownWindow: BrowserWindow | null = null
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

// Create pre-lock countdown overlay (LookAway-style)
function showCountdownOverlay(seconds: number): void {
  if (countdownWindow && !countdownWindow.isDestroyed()) {
    countdownWindow.close()
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.bounds

  countdownWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: width,
    height: height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  })

  // Make window click-through
  countdownWindow.setIgnoreMouseEvents(true)
  countdownWindow.setAlwaysOnTop(true, 'screen-saver')
  countdownWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  // Animated countdown HTML with arrow moving up
  const countdownHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: transparent;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .overlay {
            position: fixed;
            inset: 0;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            padding-bottom: 100px;
          }
          .countdown-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            animation: slideUp 0.5s ease-out;
          }
          @keyframes slideUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .arrow-container {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f97316, #ea580c);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 8px 32px rgba(249, 115, 22, 0.4);
            animation: pulse 1s ease-in-out infinite, float 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .arrow {
            width: 40px;
            height: 40px;
            fill: white;
          }
          .message {
            margin-top: 16px;
            padding: 12px 24px;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            color: white;
            font-size: 16px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          .countdown {
            font-size: 24px;
            font-weight: 700;
            color: #f97316;
            margin-left: 8px;
          }
          .dismiss-hint {
            margin-top: 8px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
          }
        </style>
      </head>
      <body>
        <div class="overlay">
          <div class="countdown-container">
            <div class="arrow-container">
              <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="message">
              Time to move! Locking in <span class="countdown" id="countdown">${seconds}</span>
            </div>
            <div class="dismiss-hint">Walk to your checkpoint to unlock</div>
          </div>
        </div>
        <script>
          let remaining = ${seconds};
          const countdownEl = document.getElementById('countdown');
          const interval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
              clearInterval(interval);
              // Window will be closed by main process
            } else {
              countdownEl.textContent = remaining;
            }
          }, 1000);
        </script>
      </body>
    </html>
  `

  countdownWindow.loadURL(`data:text/html,${encodeURIComponent(countdownHTML)}`)
  countdownWindow.show()

  // Auto-close after duration
  setTimeout(() => {
    hideCountdownOverlay()
  }, seconds * 1000)
}

function hideCountdownOverlay(): void {
  if (countdownWindow && !countdownWindow.isDestroyed()) {
    countdownWindow.close()
    countdownWindow = null
  }
}

// Create overlay window for a specific display
function createOverlayWindow(display: Electron.Display): BrowserWindow {
  const overlay = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0b',
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    closable: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  })

  // Load a simple locked screen HTML
  overlay.loadURL(`data:text/html,
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background: #0a0a0b;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .container {
            text-align: center;
            color: #71717a;
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          .message {
            font-size: 24px;
            color: #a1a1aa;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🔒</div>
          <div class="message">Screen Locked</div>
        </div>
      </body>
    </html>
  `)

  overlay.setAlwaysOnTop(true, 'screen-saver')
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  overlay.setKiosk(true)

  return overlay
}

// Lockdown mode functions
function enterLockdown(): void {
  if (!mainWindow) return

  // DEV MODE: Show warning instead of full lockdown for first 5 seconds
  if (isDev) {
    console.log('⚠️  DEV MODE: Entering lockdown (Cmd+Shift+Escape to escape)')
  }

  isLocked = true

  // Get all displays
  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()

  // Create overlay windows for all non-primary displays
  displays.forEach((display) => {
    if (display.id !== primaryDisplay.id) {
      const overlay = createOverlayWindow(display)
      overlayWindows.push(overlay)
      overlay.show()
    }
  })

  // Move main window to primary display and enter kiosk
  mainWindow.setBounds(primaryDisplay.bounds)

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

  // Close all overlay windows
  overlayWindows.forEach((overlay) => {
    if (!overlay.isDestroyed()) {
      overlay.setClosable(true)
      overlay.close()
    }
  })
  overlayWindows = []

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

ipcMain.handle('show-countdown-overlay', (_event, seconds: number) => {
  showCountdownOverlay(seconds)
  return { success: true }
})

ipcMain.handle('hide-countdown-overlay', () => {
  hideCountdownOverlay()
  return { success: true }
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
