import { MessageSquare } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const modelsMap = selection.models || {}
  const modelKeysString = Object.keys(modelsMap).sort().join(',')

  useEffect(() => {
    if (activeModelKey) return
    const keys = Object.keys(modelsMap)
    if (keys.length > 0) {
      setActiveModelKey(keys[0])
    }
  }, [modelKeysString])

  // Session status detection matching OpenCode
  const userMessages = useMemo(
    () => messages?.filter((m) => m.info.role === 'user') ?? [],
    [messages]
  )
  const lastUserMessage = userMessages[userMessages.length - 1]
  const isProcessing = useMemo(() => {
    if (!messages || messages.length === 0) return false

    const lastMsg = messages[messages.length - 1]
    if (!lastMsg?.info) return false

    // Processing when: mutation pending, or last user message has no completed assistant response, or last message is streaming
    if (sendPromptMutation.isPending) return true

    if (lastMsg.info.role === 'user') return true

    const lastAssistant = messages
      .filter((m) => m.info.role === 'assistant')
      .at(-1)

    if (lastAssistant) {
      const assistant = lastAssistant.info
      const completed = (
        assistant as unknown as { time?: { completed?: number } }
      ).time?.completed
      const hasError = (assistant as unknown as { error?: { name?: string } })
        .error?.name
      return !completed && hasError !== 'MessageAbortedError'
    }

    return false
  }, [messages, sendPromptMutation.isPending])

  // Working state: session is busy (has active user message being responded to)
  const isWorking = useMemo(() => {
    if (sendPromptMutation.isPending) return true
    if (!lastUserMessage) return false

    const userId = lastUserMessage.info.id
    const assistants = messages?.filter(
      (m) =>
        m.info.role === 'assistant' &&
        (m.info as unknown as { parentID?: string }).parentID === userId
    )
    if (!assistants || assistants.length === 0) return true

    const lastAssistant = assistants[assistants.length - 1]
    const completed = (
      lastAssistant.info as unknown as { time?: { completed?: number } }
    ).time?.completed
    const hasError = (
      lastAssistant.info as unknown as { error?: { name?: string } }
    ).error?.name
    return !completed && hasError !== 'MessageAbortedError'
  }, [messages, sendPromptMutation.isPending, lastUserMessage])

  // Session title (use session title or fallback)
  const sessionTitle = useMemo(() => {
    return session?.title || sessionId || undefined
  }, [session, sessionId])

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

  // Global keyboard shortcut for auto-focus
  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if an editable element is focused
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      (active.isContentEditable ||
        active.tagName === 'INPUT' ||
        active.tagName === 'TEXTAREA' ||
        active.tagName === 'SELECT')
    ) {
      return
    }

    // Don't intercept modifier keys by themselves
    if (
      event.key === 'Control' ||
      event.key === 'Alt' ||
      event.key === 'Meta' ||
      event.key === 'Shift'
    )
      return

    // Ctrl/meta shortcuts are for commands, skip them
    if (event.ctrlKey || event.metaKey) return

    // Don't focus if a key is being handled by some interactive element
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a'))
    ) {
      return
    }

    // Auto-focus on single character typing
    if (
      event.key.length === 1 &&
      event.key !== 'Unidentified' &&
      !event.isComposing
    ) {
      const inputEl = document.querySelector(
        '[data-component="prompt-input"] textarea, textarea[placeholder]'
      ) as HTMLTextAreaElement | null
      if (inputEl) {
        inputEl.focus()
        // Prepend the key to the input
        if (document.activeElement === inputEl) {
          const start = inputEl.selectionStart
          const end = inputEl.selectionEnd
          const current = inputEl.value
          inputEl.value =
            current.slice(0, start) + event.key + current.slice(end)
          inputEl.selectionStart = inputEl.selectionEnd = start + 1
          inputEl.dispatchEvent(new Event('change', { bubbles: true }))
          // Update React state
          const event2 = new Event('input', { bubbles: true })
          Object.defineProperty(event2, 'target', { value: inputEl })
          inputEl.dispatchEvent(event2)
        }
        event.preventDefault()
      }
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  return (
    <main className="grid h-full grid-rows-[1fr_auto] overflow-hidden">
      <div className="grid h-full grid-rows-[auto_1fr_auto] overflow-hidden">
        {/* Header */}
        <div className="border-b px-5 py-3">
          <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <MessageSquare className="text-muted-foreground size-4" />
            {session?.title || sessionId}
          </h1>
          {project && (
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              {project.worktree}
            </p>
          )}
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-hidden px-5"
          data-component="session-messages"
        >
          <MessagesList
            messages={messages || []}
            isLoading={!!isLoading}
            loadError={loadError}
            isProcessing={isProcessing}
            sessionTitle={sessionTitle}
            isWorking={isWorking}
          />
        </div>

        {/* Error banner */}
        {sendError && (
          <div className="border-destructive/30 bg-destructive/10 text-destructive border-t px-5 py-1.5 text-xs">
            {sendError}
          </div>
        )}
      </div>

      {/* Controls and Input */}
      <div data-component="session-composer">
        <PromptControls
          projectId={projectId!}
          sessionId={sessionId!}
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
        />
      </div>
    </main>
  )
}
