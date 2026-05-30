import { cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Loader,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectsQuery, useSessionsQuery } from '../hooks/queries'
import { Button } from './ui/button'

export function AppSidebar() {
  const { projectId: activeProjectId, sessionId: activeSessionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: projectsData, isLoading, error } = useProjectsQuery()
  const { data: sessionsData } = useSessionsQuery()
  const sessionsByProject = useMemo(() => {
    if (!sessionsData) return {}
    const map: Record<string, typeof sessionsData> = {}
    for (const session of sessionsData) {
      const key = session.id
      if (!map[key]) {
        const projectId = session.projectID || session.parentID
        if (projectId) {
          if (!map[projectId]) map[projectId] = []
          map[projectId].push(session)
        }
      }
    }
    return map
  }, [sessionsData])

  return (
    <aside className="bg-sidebar flex h-full flex-col overflow-hidden border-r">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-10 items-center justify-between border-b px-3">
          <span className="text-muted-foreground text-[10px] font-medium tracking-[0.5px] uppercase">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent/60 size-6"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ['projects'] })
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
          </Button>
        </div>

        {error && (
          <div className="text-destructive px-3 py-2 text-xs">
            {error.message}
          </div>
        )}

        <div className="better-scrollbar flex-1 overflow-auto py-1">
          {(!projectsData || projectsData.length === 0) && !isLoading ? (
            <div className="text-muted-foreground px-3 py-2 text-xs">
              No projects found
            </div>
          ) : (
            <ul className="space-y-0.5 px-1.5">
              {(projectsData ?? [])
                .filter((p) => !(p.id === 'global' || p.worktree === '/'))
                .map((project) => {
                  const isActiveProject = activeProjectId === project.id
                  const projectSessions = sessionsByProject[project.id] || []
                  const isExpanded = isActiveProject

                  return (
                    <li key={project.id}>
                      <button
                        onClick={() => {
                          if (activeProjectId === project.id) {
                            void navigate('/')
                          } else {
                            void navigate(`/project/${project.id}`)
                          }
                        }}
                        className={cn(
                          'hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                          isActiveProject
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-foreground'
                        )}
                      >
                        <Folder className="text-muted-foreground size-3.5 shrink-0" />
                        <span className="flex-1 truncate text-[13px]">
                          {project.worktree}
                        </span>
                        {projectSessions.length > 0 && (
                          <>
                            <span className="text-muted-foreground ml-auto text-[10px] tabular-nums">
                              {projectSessions.length}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                            ) : (
                              <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                            )}
                          </>
                        )}
                      </button>

                      {isExpanded && projectSessions.length > 0 && (
                        <ul className="mt-0.5 ml-4 space-y-0.5 border-l pl-2.5">
                          {projectSessions.map((session) => {
                            const isActiveSession =
                              activeSessionId === session.id
                            return (
                              <li key={session.id}>
                                <button
                                  onClick={() =>
                                    void navigate(
                                      `/inbox/${project.id}/${session.id}`
                                    )
                                  }
                                  className={cn(
                                    'hover:bg-accent/60 flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[12.5px] transition-colors',
                                    isActiveSession
                                      ? 'bg-accent/80 text-accent-foreground font-medium'
                                      : 'text-muted-foreground hover:text-foreground'
                                  )}
                                >
                                  <MessageSquare className="size-3 shrink-0 opacity-70" />
                                  <span className="flex-1 truncate">
                                    {session.title || session.directory}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
