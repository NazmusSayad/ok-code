import { useOpencodeStore } from './store'

export function useCurrentProjectOptional() {
  const currentProject = useOpencodeStore(
    (state) =>
      state.projects.data.find(
        (p) => p.id === state.projects.currentProjectId
      ) ?? null
  )

  return currentProject
}

export function useCurrentProject() {
  const currentProject = useCurrentProjectOptional()
  if (!currentProject) {
    throw new Error('No project selected')
  }

  return currentProject
}
