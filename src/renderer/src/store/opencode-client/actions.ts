import { useOpencodeStore } from './store'

export async function fetchProjects(): Promise<void> {
  useOpencodeStore.setState((draft) => {
    draft.projects.isLoading = true
    draft.projects.error = null
  })

  try {
    const projects = await window.api.opencode.getProjects()
    useOpencodeStore.setState((draft) => {
      draft.projects.isLoading = false
      draft.projects.data = projects
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    useOpencodeStore.setState((draft) => {
      draft.projects.isLoading = false
      draft.projects.error = message
    })
  }
}

export async function fetchSessions(): Promise<void> {
  useOpencodeStore.setState((draft) => {
    draft.session.isLoading = true
    draft.session.error = null
  })

  try {
    const sessions = await window.api.opencode.getSessions()
    useOpencodeStore.setState((draft) => {
      draft.session.isLoading = false
      draft.session.data = sessions
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    useOpencodeStore.setState((draft) => {
      draft.session.isLoading = false
      draft.session.error = message
    })
  }
}

export async function fetchCommands(): Promise<void> {
  useOpencodeStore.setState((draft) => {
    draft.command.isLoading = true
    draft.command.error = null
  })

  try {
    const commands = await window.api.opencode.getCommands()
    useOpencodeStore.setState((draft) => {
      draft.command.isLoading = false
      draft.command.data = commands
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    useOpencodeStore.setState((draft) => {
      draft.command.isLoading = false
      draft.command.error = message
    })
  }
}

export async function initialize(): Promise<void> {
  await Promise.all([fetchProjects(), fetchSessions(), fetchCommands()])
}

export function selectProject(id: string | null): void {
  useOpencodeStore.setState((draft) => {
    draft.projects.currentProjectId = id
  })
}
