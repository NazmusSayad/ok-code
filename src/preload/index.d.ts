import type { Command, Project, Session } from '@opencode-ai/sdk'
import type { ElectronAPI } from '@electron-toolkit/preload'

type OpencodeAPI = {
  getProjects: () => Promise<Project[]>
  getSessions: () => Promise<Session[]>
  getCommands: () => Promise<Command[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      opencode: OpencodeAPI
    }
  }
}
