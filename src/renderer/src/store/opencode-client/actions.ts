import { useOpencodeStore } from './store'

export async function fetchProjects(): Promise<void> {
  useOpencodeStore.setState((draft) => {
    draft.projects.isLoading = true
    draft.projects.error = null
  })

  try {
    const projects = await window.api.opencode.getProjects()
    useOpencodeStore.setState((draft) => {
      draft.projects.data = projects
      draft.projects.isLoading = false
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    useOpencodeStore.setState((draft) => {
      draft.projects.error = message
      draft.projects.isLoading = false
    })
  }
}

export async function initialize(): Promise<void> {
  await fetchProjects()
}

export function selectProject(id: string | null): void {
  useOpencodeStore.setState((draft) => {
    draft.projects.currentProjectId = id
  })
}
