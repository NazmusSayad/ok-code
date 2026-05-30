import type { ElectronAPI } from '@electron-toolkit/preload'
import type { Prettify } from 'daily-code'
import type { OpenCodePublicAPI } from '../core/opencode-public-api'

declare global {
  interface Window {
    electron: ElectronAPI
    opencode: Prettify<OpenCodePublicAPI>
  }
}
