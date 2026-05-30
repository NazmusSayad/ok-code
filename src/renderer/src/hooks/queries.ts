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

export function useProjectSessionsQuery(projectId: string) {
  const { data: sessions } = useSessionsQuery()

  const projectSessions = useMemo(() => {
    if (!sessions) return []

    return sessions.filter(
      (s) =>
        s.id === projectId ||
        s.parentID === projectId ||
        s.projectID === projectId
    )
  }, [projectId, sessions])

  return projectSessions
}

export function useSessionMessagesQuery(sessionId: string) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: () => window.opencode.getSessionMessages(sessionId),
    enabled: !!sessionId,
    refetchInterval: (query) => {
      const data = query.state.data as unknown
      if (!Array.isArray(data) || data.length === 0) return false
      const last = data[data.length - 1] as {
        info?: { role?: string; time?: { completed?: number }; error?: unknown }
      }
      if (!last?.info) return false
      if (last.info.role === 'user') return 400
      if (last.info.role === 'assistant') {
        if (last.info.time?.completed || last.info.error) return false
        return 250
      }
      return false
    },
  })
}

export function useAgentsQuery() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => window.opencode.getAgents(),
  })
}

export function useModelsQuery() {
  return useQuery({
    queryKey: ['models'],
    queryFn: () => window.opencode.getModels(),
  })
}

export function useSendPromptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      sessionId: string
      text: string
      agent?: string
      model?: string
      variant?: string
    }) => window.opencode.sendPrompt(vars.sessionId, vars.text, vars),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['messages', variables.sessionId],
      })
    },
  })
}

export function useAbortPromptMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => window.opencode.abortPrompt(sessionId),
    onSuccess: (_data, sessionId) => {
      void queryClient.invalidateQueries({ queryKey: ['messages', sessionId] })
    },
  })
}
