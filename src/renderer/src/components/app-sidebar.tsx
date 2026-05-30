import { Folder, Loader, RefreshCw } from 'lucide-react'
import {
  fetchProjects,
  selectProject,
  useOpencodeStore,
} from '../store/opencode-client'
import { Button } from './ui/button'

export function AppSidebar() {
  const projectsData = useOpencodeStore((state) => state.projects.data)
  const isLoading = useOpencodeStore((state) => state.projects.isLoading)
  const error = useOpencodeStore((state) => state.projects.error)
  const currentProjectId = useOpencodeStore(
    (state) => state.projects.currentProjectId
  )

  return (
    <aside className="flex h-full flex-col border-r bg-muted/40">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => {
              void fetchProjects()
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

        {error && <div className="p-3 text-xs text-destructive">{error}</div>}

        <div className="flex-1 overflow-auto">
          {projectsData.length === 0 && !isLoading ? (
            <div className="p-3 text-xs text-muted-foreground">
              No projects found
            </div>
          ) : (
            <ul className="space-y-0.5 p-1">
              {projectsData
                .filter((p) => !(p.id === 'global' || p.worktree === '/'))
                .map((project) => (
                  <li key={project.id}>
                    <Button
                      variant={
                        currentProjectId === project.id ? 'secondary' : 'ghost'
                      }
                      className="h-auto w-full justify-start gap-2 px-2 py-1.5 text-xs"
                      onClick={() => selectProject(project.id)}
                    >
                      <Folder className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{project.worktree}</span>
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
