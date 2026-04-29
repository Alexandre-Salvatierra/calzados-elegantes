const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

// Modo desarrollo: carga desde Vite dev server
// Modo producción: carga desde archivos estáticos del build
const isDev = process.argv.includes('--dev')

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    title: 'Calzados Elegantes — Sistema de Gestión',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Ocultar menú nativo (la app tiene su propia navegación)
  win.setMenuBarVisibility(false)

  if (isDev) {
    // Desarrollo: conecta al servidor Vite
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    // Producción: carga los archivos estáticos del build de React
    win.loadFile(path.join(__dirname, '../frontend/dist/index.html'))
  }

  // Abrir links externos en el navegador del sistema, no en Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
