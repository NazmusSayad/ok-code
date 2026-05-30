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
      <div className="border-b p-6">
        <h1 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Folder className="text-muted-foreground size-5" />
          {selectedProject.worktree}
        </h1>

        <div className="bg-muted/40 space-y-2 rounded-lg border p-4 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24">ID</span>
            <span className="font-mono">{selectedProject.id}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24">Path</span>
            <span>{selectedProject.worktree}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24">VCS</span>
            <span className="inline-flex items-center gap-1">
              {selectedProject.vcs ? (
                <>
                  <GitBranch className="size-3.5" />
                  {selectedProject.vcs}
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-24">Created</span>
            <span>
              {new Date(selectedProject.time.created * 1000).toLocaleString()}
            </span>
          </div>
          {selectedProject.time.initialized && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-24">Initialized</span>
              <span>
                {new Date(
                  selectedProject.time.initialized * 1000
                ).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Select a session from the sidebar to view messages
      </div>
    </main>
  )
}
