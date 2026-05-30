import { app, BrowserWindow, screen } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export type WindowState = {
  x?: number
  y?: number
  width: number
  height: number
  monitor: number
  isMaximized: boolean
}

const STATE_FILE = 'window-state.json'

function getStatePath() {
  return join(app.getPath('userData'), STATE_FILE)
}

export function loadWindowState(): WindowState | null {
  try {
    const p = getStatePath()
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {
    return null
  }
}

function saveWindowState(state: WindowState) {
  try {
    writeFileSync(getStatePath(), JSON.stringify(state), 'utf-8')
  } catch {}
}

function getCurrentState(win: BrowserWindow): WindowState {
  const isMax = win.isMaximized()
  const isMin = win.isMinimized()
  const bounds = isMax || isMin ? win.getNormalBounds() : win.getBounds()

  const displays = screen.getAllDisplays()
  const display = screen.getDisplayMatching(bounds)
  const monitor = displays.findIndex((d) => d.id === display.id)

  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    monitor: monitor < 0 ? 0 : monitor,
    isMaximized: isMax,
  }
}

export function registerWindowStateHandlers(win: BrowserWindow) {
  let timer: ReturnType<typeof setTimeout> | null = null

  function doSave() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (!win.isDestroyed()) saveWindowState(getCurrentState(win))
      timer = null
    }, 500)
  }

  function saveImmediate() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    saveWindowState(getCurrentState(win))
  }

  win.on('move', doSave)
  win.on('resize', doSave)
  win.on('maximize', saveImmediate)
  win.on('unmaximize', saveImmediate)
  win.on('close', saveImmediate)
}
