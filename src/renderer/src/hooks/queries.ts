import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => window.api.opencode.getProjects(),
  })
}

export function useProjectQuery(projectId: string | null) {
  const { data: projects } = useProjectsQuery()

  const project = useMemo(() => {
    if (!projectId || !projects) return null
    return projects.find((p) => p.id === projectId) ?? null
  }, [projectId, projects])

  return project
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: () => window.api.opencode.getSessions(),
  })
}

export function useProjectSessionsQuery(projectId: string | null) {
  const { data: sessions } = useSessionsQuery()

  const projectSessions = useMemo(() => {
    if (!projectId || !sessions) return []
    return sessions.filter(
      (s) =>
        s.id === projectId ||
        s.projectID === projectId ||
        s.parentID === projectId
    )
  }, [projectId, sessions])

  return projectSessions
}

export function useSessionMessagesQuery(sessionId: string | null) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () =>
      sessionId ? window.api.opencode.getSessionMessages(sessionId) : [],
    enabled: !!sessionId,
  })
}
