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

  console.log(sessionsByProject)

  return (
    <aside className="bg-muted/40 flex h-full flex-col overflow-hidden border-r">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Projects
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
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
        </div>

        {error && (
          <div className="text-destructive p-3 text-xs">{error.message}</div>
        )}

        <div className="better-scrollbar flex-1 overflow-auto">
          {(!projectsData || projectsData.length === 0) && !isLoading ? (
            <div className="text-muted-foreground p-3 text-xs">
              No projects found
            </div>
          ) : (
            <ul className="space-y-0.5 p-1">
              {(projectsData ?? [])
                .filter((p) => !(p.id === 'global' || p.worktree === '/'))
                .map((project) => {
                  const isActiveProject = activeProjectId === project.id
                  const projectSessions = sessionsByProject[project.id] || []
                  const isExpanded = Boolean(isActiveProject)

                  return (
                    <li key={project.id}>
                      <Button
                        variant={isActiveProject ? 'secondary' : 'ghost'}
                        className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-xs"
                        onClick={() => {
                          if (activeProjectId === project.id) {
                            void navigate('/')
                          } else {
                            void navigate(`/project/${project.id}`)
                          }
                        }}
                      >
                        <Folder className="text-muted-foreground size-3.5 shrink-0" />
                        <span className="truncate">{project.worktree}</span>
                        {isExpanded && projectSessions.length > 0 && (
                          <span className="text-muted-foreground ml-auto text-[10px]">
                            {projectSessions.length}
                          </span>
                        )}
                        {projectSessions.length > 0 &&
                          (isExpanded ? (
                            <ChevronDown className="text-muted-foreground size-3 shrink-0" />
                          ) : (
                            <ChevronRight className="text-muted-foreground size-3 shrink-0" />
                          ))}
                      </Button>

                      {isExpanded && projectSessions.length > 0 && (
                        <ul className="ml-3 space-y-0.5 border-l pl-1">
                          {projectSessions.map((session) => (
                            <li key={session.id}>
                              <Button
                                variant={
                                  activeSessionId === session.id
                                    ? 'secondary'
                                    : 'ghost'
                                }
                                className="h-auto w-full justify-start gap-2 px-2 py-1 text-xs"
                                onClick={() =>
                                  void navigate(
                                    `/inbox/${project.id}/${session.id}`
                                  )
                                }
                              >
                                <MessageSquare className="text-muted-foreground size-3 shrink-0" />
                                <span className="truncate">
                                  {session.title || session.directory}
                                </span>
                              </Button>
                            </li>
                          ))}
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
