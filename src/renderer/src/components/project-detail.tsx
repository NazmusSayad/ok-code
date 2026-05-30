import { Folder, GitBranch, MessageSquare } from 'lucide-react'
import { useOpencodeStore, selectSession } from '../store/opencode-client'
import { useCurrentProjectOptional, useProjectSessions } from '../store/opencode-client/hooks'

export function ProjectDetail() {
  const selectedProject = useCurrentProjectOptional()
  const projectSessions = useProjectSessions()
  const currentSessionId = useOpencodeStore((state) => state.session.currentSessionId)

  return (
    <main className="flex h-full flex-col overflow-auto">
      {selectedProject ? (
        <>
          {/* Project Header */}
          <div className="border-b p-6">
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
          </div>

          {/* Sessions List */}
          <div className="flex-1 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Sessions ({projectSessions.length})
            </h2>

            {projectSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions for this project.</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {projectSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => selectSession(session.id)}
                      className={`w-full text-left px-4 py-3 text-sm transition hover:bg-muted/50 ${
                        currentSessionId === session.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{session.title}</span>
                        {session.share && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                            shared
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="size-3" />
                        <span className="font-mono truncate">{session.directory}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Updated {new Date(session.time.updated * 1000).toLocaleString()}</span>
                      </div>
                    </button>
                  )
                )}
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
