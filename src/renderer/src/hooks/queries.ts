import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

export function useProjectsQuery() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => window.opencode.getProjects(),
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
    queryFn: () => window.opencode.getSessions(),
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
      sessionId ? window.opencode.getSessionMessages(sessionId) : [],
    enabled: !!sessionId,
  })
}

export function useAgentsQuery() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => window.opencode.getAgents(),
  })
}

export function useSendPromptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, text }: { sessionId: string; text: string }) =>
      window.opencode.sendPrompt(sessionId, text),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.sessionId],
      })
    },
  })
}

export function useAbortPromptMutation() {
  return useMutation({
    mutationFn: (sessionId: string) => window.opencode.abortPrompt(sessionId),
  })
}
