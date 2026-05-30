import { Folder, GitBranch } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useProjectQuery } from '../../hooks/queries'

export function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const selectedProject = useProjectQuery(projectId!)

  if (!selectedProject) {
    return (
      <main className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Project not found
      </main>
    )
  }

  return (
    <main className="flex h-full flex-col overflow-auto">
      <div className="border-b px-5 py-4">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Folder className="text-muted-foreground size-4" />
          {selectedProject.worktree}
        </h1>
      </div>

      <div className="p-5">
        <div className="bg-muted/30 space-y-1.5 rounded-lg border p-4 text-sm">
          <div className="flex gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-xs">
              ID
            </span>
            <span className="font-mono text-xs">{selectedProject.id}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-xs">
              Path
            </span>
            <span className="truncate">{selectedProject.worktree}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-xs">
              VCS
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              {selectedProject.vcs ? (
                <>
                  <GitBranch className="size-3" />
                  {selectedProject.vcs}
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="flex gap-3">
            <span className="text-muted-foreground w-20 shrink-0 text-xs">
              Created
            </span>
            <span className="text-xs">
              {new Date(selectedProject.time.created * 1000).toLocaleString()}
            </span>
          </div>
          {selectedProject.time.initialized && (
            <div className="flex gap-3">
              <span className="text-muted-foreground w-20 shrink-0 text-xs">
                Initialized
              </span>
              <span className="text-xs">
                {new Date(
                  selectedProject.time.initialized * 1000
                ).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="text-muted-foreground mt-8 text-center text-xs">
          Select a session from the sidebar to view messages
        </div>
      </div>
    </main>
  )
}
