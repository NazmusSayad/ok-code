import { electronAPI } from '@electron-toolkit/preload'
import type { Prettify } from 'daily-code'
import { contextBridge, ipcRenderer } from 'electron'
import { OpenCodePublicAPI } from '../main/opencode-public-api'

const generalApi = {}

const opencodeApi = {} as Prettify<OpenCodePublicAPI>
const methods = Object.getOwnPropertyNames(OpenCodePublicAPI.prototype)
methods.forEach((method) => {
  if (method === 'constructor') return

  opencodeApi[method] = (...args: unknown[]) => {
    return ipcRenderer.invoke(`opencode:${method}`, ...args)
  }
})

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('opencode', opencodeApi)
    contextBridge.exposeInMainWorld('api', generalApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI

  // @ts-expect-error (define in dts)
  window.opencode = opencodeApi

  // @ts-expect-error (define in dts)
  window.api = generalApi
}
