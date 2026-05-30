import { useMemo } from 'react'
import { useOpencodeStore } from './store'

export function useCurrentProjectOptional() {
  const currentProject = useOpencodeStore((state) =>
    state.projects.data.find((p) => p.id === state.projects.currentProjectId)
  )

  return currentProject ?? null
}

export function useCurrentProject() {
  const currentProject = useCurrentProjectOptional()
  if (!currentProject) {
    throw new Error('No project selected')
  }

  return currentProject
}

export function useCurrentProjectSessions() {
  const currentProjectId = useOpencodeStore(
    (state) => state.projects.currentProjectId
  )

  const sessionsData = useOpencodeStore((state) => state.session.data)

  const currentProjectSessions = useMemo(() => {
    if (!currentProjectId) return []
    return sessionsData.filter(
      (s) =>
        s.id === currentProjectId ||
        s.projectID === currentProjectId ||
        s.parentID === currentProjectId
    )
  }, [currentProjectId, sessionsData])

  return currentProjectSessions
}

export function useSelectedSessionMessages() {
  return useOpencodeStore((state) => state.messages)
}
