import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  opencode: {
    getProjects: () => ipcRenderer.invoke('opencode:getProjects'),
    getSessions: () => ipcRenderer.invoke('opencode:getSessions'),
    getCommands: () => ipcRenderer.invoke('opencode:getCommands'),
    getSessionMessages: (sessionId: string) =>
      ipcRenderer.invoke('opencode:getSessionMessages', sessionId),
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI
  // @ts-expect-error (define in dts)
  window.api = api
}
