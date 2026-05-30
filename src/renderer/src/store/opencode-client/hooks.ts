import { useMemo } from 'react'
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

export function useProjectSessions() {
  const currentProjectId = useOpencodeStore(
    (state) => state.projects.currentProjectId
  )
  const sessionsData = useOpencodeStore((state) => state.session.data)

  return useMemo(() => {
    if (!currentProjectId) return []
    return sessionsData.filter((s) => s.projectID === currentProjectId)
  }, [currentProjectId, sessionsData])
}
