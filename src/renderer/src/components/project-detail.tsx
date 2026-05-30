import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, GitBranch, Loader2, MessageSquare } from 'lucide-react'
import {
  useCurrentProject,
  useCurrentProjectSessions,
  useSelectedSessionMessages,
} from '../store/opencode-client/hooks'
import { fetchSessionMessages } from '../store/opencode-client/actions'

export function ProjectDetail() {
  const selectedProject = useCurrentProject()
  const projectSessions = useCurrentProjectSessions()
  const { data: messages, isLoading, error, currentSessionId } = useSelectedSessionMessages()
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  function handleSessionClick(sessionId: string): void {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null)
    } else {
      setExpandedSessionId(sessionId)
      if (currentSessionId !== sessionId) {
        fetchSessionMessages(sessionId)
      }
    }
  }

  return (
    <main className="flex h-full flex-col overflow-auto">
      {selectedProject ? (
        <>
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
                  {new Date(
                    selectedProject.time.created * 1000
                  ).toLocaleString()}
                </span>
              </div>
              {selectedProject.time.initialized && (
                <div className="flex gap-2">
                  <span className="w-24 text-muted-foreground">
                    Initialized
                  </span>
                  <span>
                    {new Date(
                      selectedProject.time.initialized * 1000
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Sessions ({projectSessions.length})
            </h2>

            {projectSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sessions for this project.
              </p>
            ) : (
              <div className="divide-y rounded-lg border">
                {projectSessions.map((session) => (
                  <div key={session.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted/40"
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div className="flex-1">
                        <span className="font-medium">{session.title}</span>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="size-3" />
                          <span className="font-mono truncate">
                            {session.directory}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Updated{' '}
                          {new Date(session.time.updated * 1000).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.share && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                            shared
                          </span>
                        )}
                        {expandedSessionId === session.id ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {expandedSessionId === session.id && (
                      <div className="border-t bg-muted/20 px-4 py-3">
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" />
                            Loading messages...
                          </div>
                        ) : error ? (
                          <p className="text-sm text-destructive">{error}</p>
                        ) : messages.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No messages in this session.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((msg) => (
                              <div
                                key={msg.info.id}
                                className={`rounded-lg border p-3 text-sm ${
                                  msg.info.role === 'assistant'
                                    ? 'bg-muted/30'
                                    : 'bg-background'
                                }`}
                              >
                                <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                                      msg.info.role === 'user'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    }`}
                                  >
                                    {msg.info.role}
                                  </span>
                                  <span>
                                    {new Date(
                                      msg.info.time.created * 1000
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {msg.parts.map((part, idx) => {
                                    switch (part.type) {
                                      case 'text':
                                        return (
                                          <p key={idx} className="whitespace-pre-wrap">
                                            {part.text}
                                          </p>
                                        )
                                      case 'reasoning':
                                        return (
                                          <p key={idx} className="italic text-muted-foreground">
                                            {part.text}
                                          </p>
                                        )
                                      default:
                                        return (
                                          <p key={idx} className="text-xs text-muted-foreground">
                                            [{part.type}]
                                          </p>
                                        )
                                    }
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
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
