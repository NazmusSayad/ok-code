import { app, BrowserWindow, screen } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

const STATE_FILE = 'window-state.json'

function getStatePath(): string {
  return join(app.getPath('userData'), STATE_FILE)
}

export function loadWindowState(): WindowState | null {
  try {
    const path = getStatePath()
    if (!existsSync(path)) return null
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

function saveWindowState(state: WindowState): void {
  try {
    writeFileSync(getStatePath(), JSON.stringify(state), 'utf-8')
  } catch {
    // Silently fail — state saving should never crash the app
  }
}

function isVisibleOnAnyDisplay(state: WindowState): boolean {
  if (state.x === undefined || state.y === undefined) return false
  const cx = state.x + state.width / 2
  const cy = state.y + state.height / 2
  return screen.getAllDisplays().some((display) => {
    const { x: dx, y: dy, width: dw, height: dh } = display.bounds
    return cx >= dx && cx < dx + dw && cy >= dy && cy < dy + dh
  })
}

function centerOnPrimary(state: WindowState): WindowState {
  const {
    x: px,
    y: py,
    width: pw,
    height: ph,
  } = screen.getPrimaryDisplay().workArea
  return {
    ...state,
    x: Math.round(px + (pw - state.width) / 2),
    y: Math.round(py + (ph - state.height) / 2),
  }
}

export function validateWindowState(
  state: WindowState | null
): WindowState | null {
  if (!state) return null
  if (
    state.x === undefined ||
    state.y === undefined ||
    !isVisibleOnAnyDisplay(state)
  ) {
    return centerOnPrimary(state)
  }
  return state
}

function getCurrentState(win: BrowserWindow): WindowState {
  const isMaximized = win.isMaximized()
  const isMinimized = win.isMinimized()
  const bounds =
    isMaximized || isMinimized ? win.getNormalBounds() : win.getBounds()
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    isMaximized,
  }
}

export function registerWindowStateHandlers(win: BrowserWindow): void {
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedSave(): void {
    if (saveTimer !== null) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (!win.isDestroyed()) {
        saveWindowState(getCurrentState(win))
      }
      saveTimer = null
    }, 500)
  }

  function saveImmediate(): void {
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    saveWindowState(getCurrentState(win))
  }

  win.on('resize', debouncedSave)
  win.on('move', debouncedSave)
  win.on('maximize', saveImmediate)
  win.on('unmaximize', saveImmediate)
  win.on('close', saveImmediate)
}
