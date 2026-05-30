import type { ElectronAPI } from '@electron-toolkit/preload'
import type { Command, Message, Part, Project, Session } from '@opencode-ai/sdk'

type OpencodeAPI = {
  getProjects: () => Promise<Project[]>
  getSessions: () => Promise<Session[]>
  getCommands: () => Promise<Command[]>
  getSessionMessages: (
    sessionId: string
  ) => Promise<{ info: Message; parts: Part[] }[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      opencode: OpencodeAPI
    }
  }
}
