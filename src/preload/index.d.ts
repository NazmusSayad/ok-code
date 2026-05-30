import type { ElectronAPI } from '@electron-toolkit/preload'
import type { Project } from '@opencode-ai/sdk'

type OpencodeAPI = {
  getProjects: () => Promise<Project[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      opencode: OpencodeAPI
    }
  }
}
