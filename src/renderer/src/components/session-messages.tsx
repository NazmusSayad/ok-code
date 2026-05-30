import { Loader2, MessageSquare } from 'lucide-react'
import { useParams } from 'react-router-dom'
import {
  useProjectQuery,
  useProjectSessionsQuery,
  useSessionMessagesQuery,
} from '../hooks/queries'

export function SessionMessages() {
  const { projectId, sessionId } = useParams<{
    projectId: string
    sessionId: string
  }>()
  const project = useProjectQuery(projectId!)
  const sessions = useProjectSessionsQuery(projectId!)
  const session = sessions.find((s) => s.id === sessionId)
  const {
    data: messages,
    isLoading,
    error,
  } = useSessionMessagesQuery(sessionId!)

  return (
    <main className="flex h-full flex-col overflow-auto">
      <div className="border-b px-6 py-4">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <MessageSquare className="size-5 text-muted-foreground" />
          {session?.title || sessionId}
        </h1>
        {project && (
          <p className="mt-1 text-xs text-muted-foreground">
            {project.worktree}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading messages...
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : !messages || messages.length === 0 ? (
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
                    {new Date(msg.info.time.created * 1000).toLocaleString()}
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
                          <p
                            key={idx}
                            className="text-xs text-muted-foreground"
                          >
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
    </main>
  )
}
