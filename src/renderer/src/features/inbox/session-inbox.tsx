import { MessageSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useAbortPromptMutation,
  useProjectQuery,
  useProjectSessionsQuery,
  useSendPromptMutation,
  useSessionMessagesQuery,
} from '../../hooks/queries'
import { useSessionSelection } from '../../store/persist-store/actions'
import { MessagesList } from './components/messages-list'
import { PromptControls } from './components/prompt-controls'
import { PromptInput } from './components/prompt-input'

export function SessionInbox() {
  const { projectId, sessionId } = useParams()

  const project = useProjectQuery(projectId!)
  const sessions = useProjectSessionsQuery(projectId!)
  const session = sessions.find((s) => s.id === sessionId)

  const {
    data: messages,
    isLoading,
    error: loadError,
  } = useSessionMessagesQuery(sessionId!)

  const sendPromptMutation = useSendPromptMutation()
  const abortPromptMutation = useAbortPromptMutation()

  const selection = useSessionSelection(projectId || '', sessionId || '')

  const [activeModelKey, setActiveModelKey] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const modelsMap = selection.models || {}
  const modelKeysString = Object.keys(modelsMap).sort().join(',')

  useEffect(() => {
    if (activeModelKey) return
    const keys = Object.keys(modelsMap)
    if (keys.length > 0) {
      setActiveModelKey(keys[0])
    }
  }, [modelKeysString])

  const lastMessage = messages?.[messages.length - 1]
  const isStreaming =
    !!lastMessage &&
    (lastMessage.info.role === 'user' ||
      (lastMessage.info.role === 'assistant' &&
        !lastMessage.info.time?.completed &&
        !lastMessage.info.error))
  const isProcessing = sendPromptMutation.isPending || isStreaming

  function handleSend() {
    const text = input.trim()
    if (!text || isProcessing || !sessionId || !projectId) return

    setInput('')
    setSendError(null)

    const modelsMapLocal = selection.models || {}
    let chosenProviderId: string | undefined
    let chosenModelId: string | undefined
    let chosenVariant: string | undefined

    const activeEntry = activeModelKey
      ? modelsMapLocal[activeModelKey as `${string}:${string}`]
      : undefined

    if (activeEntry) {
      chosenProviderId = activeEntry.providerId
      chosenModelId = activeEntry.modelId
      chosenVariant = activeEntry.variant
    } else {
      const firstKey = Object.keys(modelsMapLocal)[0] as
        | `${string}:${string}`
        | undefined
      if (firstKey) {
        const entry = modelsMapLocal[firstKey]
        chosenProviderId = entry.providerId
        chosenModelId = entry.modelId
        chosenVariant = entry.variant
      }
    }

    const modelStr =
      chosenProviderId && chosenModelId
        ? `${chosenProviderId}:${chosenModelId}`
        : undefined

    sendPromptMutation.mutate(
      {
        sessionId,
        text,
        agent: selection.agent,
        model: modelStr,
        variant: chosenVariant,
      },
      {
        onError: () => {
          setSendError('Failed to send message')
        },
      }
    )
  }

  async function handleAbort() {
    if (!sessionId) return
    try {
      await abortPromptMutation.mutateAsync(sessionId)
    } catch {
      setSendError('Failed to abort')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<Element>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="flex h-full flex-col">
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

      <div ref={listRef} className="flex-1 overflow-auto p-6">
        <MessagesList
          messages={messages || []}
          isLoading={!!isLoading}
          loadError={loadError}
          isProcessing={isProcessing}
        />
      </div>

      {sendError && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-xs text-destructive">
          {sendError}
        </div>
      )}

      <PromptControls
        projectId={projectId!}
        sessionId={sessionId!}
        disabled={isProcessing}
        activeModelKey={activeModelKey}
        onActiveModelKeyChange={setActiveModelKey}
      />

      <PromptInput
        input={input}
        setInput={setInput}
        isProcessing={isProcessing}
        onSend={handleSend}
        onAbort={() => void handleAbort()}
        abortPending={abortPromptMutation.isPending}
        onKeyDown={handleKeyDown}
      />
    </main>
  )
}
