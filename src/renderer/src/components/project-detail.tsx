import { Folder, GitBranch } from 'lucide-react'
import { useMemo } from 'react'
import { useOpencodeStore } from '../store/opencode-client'

export function ProjectDetail() {
  const projectsData = useOpencodeStore((state) => state.projects.data)
  const currentProjectId = useOpencodeStore((state) => state.projects.currentProjectId)

  const selectedProject = useMemo(
    () => projectsData.find((p) => p.id === currentProjectId) ?? null,
    [projectsData, currentProjectId]
  )

  return (
    <main className="flex h-full flex-col overflow-auto p-6">
      {selectedProject ? (
        <>
          <h1 className="mb-4 flex items-center gap-2 text-xl font-bold">
            <Folder className="size-5 text-muted-foreground" />
            {selectedProject.worktree}
          </h1>

          <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground">ID</span>
              <span className="font-mono">{selectedProject.id}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground">Path</span>
              <span>{selectedProject.worktree}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground">VCS Dir</span>
              <span>{selectedProject.vcsDir ?? '—'}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-24 text-muted-foreground">VCS</span>
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
              <span className="w-24 text-muted-foreground">Created</span>
              <span>
                {new Date(selectedProject.time.created * 1000).toLocaleString()}
              </span>
            </div>
            {selectedProject.time.initialized && (
              <div className="flex gap-2">
                <span className="w-24 text-muted-foreground">Initialized</span>
                <span>
                  {new Date(
                    selectedProject.time.initialized * 1000
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Select a project from the sidebar
        </div>
      )}
    </main>
  )
}
