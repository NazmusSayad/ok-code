import { Loader2, MessageSquare, Send, Square } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useAbortPromptMutation,
  useAgentsQuery,
  useModelsQuery,
  useProjectQuery,
  useProjectSessionsQuery,
  useSendPromptMutation,
  useSessionMessagesQuery,
} from '../hooks/queries'
import {
  selectSessionAgent,
  selectSessionModel,
  setSessionModelVariant,
  useSessionSelection,
} from '../store/persist-store/actions'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { NativeSelect, NativeSelectOption } from './ui/native-select'

export function SessionMessages() {
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

  const { data: agents = [] } = useAgentsQuery()
  const { data: models = [] } = useModelsQuery()
  const selection = useSessionSelection(projectId || '', sessionId || '')

  // Local UI state for which model entry in the store's models map the pickers are currently editing.
  // This is NOT stored in persist-store (store shape is source of truth, no normalization).
  const [activeModelKey, setActiveModelKey] = useState<string | null>(null)

  useEffect(() => {
    const modelsMap = selection.models || {}
    const keys = Object.keys(modelsMap)
    if (!activeModelKey && keys.length > 0) {
      setActiveModelKey(keys[0])
    }
  }, [selection.models, activeModelKey])

  const [input, setInput] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

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

    // Use store straightly, no normalization: pick from models map
    const modelsMap = selection.models || {}
    let chosenProviderId: string | undefined
    let chosenModelId: string | undefined
    let chosenVariant: string | undefined

    const activeEntry = activeModelKey
      ? modelsMap[activeModelKey as `${string}:${string}`]
      : undefined
    if (activeEntry) {
      chosenProviderId = activeEntry.providerId
      chosenModelId = activeEntry.modelId
      chosenVariant = activeEntry.variant
    } else {
      const firstKey = Object.keys(modelsMap)[0] as
        | `${string}:${string}`
        | undefined
      if (firstKey) {
        const entry = modelsMap[firstKey]
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="flex h-full flex-col overflow-auto better-scrollbar">
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

      <div ref={listRef} className="flex-1 overflow-auto better-scrollbar p-6">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading messages...
          </div>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError.message}</p>
        ) : !messages || messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No messages in this session. Send one below.
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
            {isProcessing && (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>
        )}
      </div>

      {sendError && (
        <div className="border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-xs text-destructive">
          {sendError}
        </div>
      )}

      {/* Agent / Model / Variant pickers - always visible, per-session, V2 only */}
      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-3 py-2">
        {/* Agent */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Agent
          </span>
          <NativeSelect
            value={selection.agent || ''}
            onChange={(e) => {
              if (projectId && sessionId) {
                selectSessionAgent(
                  projectId,
                  sessionId,
                  e.target.value || undefined
                )
              }
            }}
            disabled={isProcessing || agents.length === 0}
            className="h-8 min-w-[120px] text-xs"
          >
            <NativeSelectOption value="">—</NativeSelectOption>
            {agents.map((a) => (
              <NativeSelectOption key={a.name} value={a.name}>
                {a.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        {/* Model */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Model
          </span>
          <NativeSelect
            value={activeModelKey || ''}
            onChange={(e) => {
              if (projectId && sessionId) {
                const val = e.target.value
                if (val) {
                  const [providerId, modelId] = val.split(':')
                  selectSessionModel(projectId, sessionId, providerId, modelId)
                  setActiveModelKey(val)
                } else {
                  setActiveModelKey(null)
                }
              }
            }}
            disabled={isProcessing || models.length === 0}
            className="h-8 min-w-[180px] text-xs"
          >
            <NativeSelectOption value="">—</NativeSelectOption>
            {models.map((m) => {
              const val = `${m.providerID}:${m.id}`
              return (
                <NativeSelectOption key={val} value={val}>
                  {m.name}
                </NativeSelectOption>
              )
            })}
          </NativeSelect>
        </div>

        {/* Variant */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Variant
          </span>
           {(() => {
             const modelsMap = selection.models || {}
             const currentKey =
               activeModelKey || (Object.keys(modelsMap)[0] as string | undefined)
             const currentEntry = currentKey
               ? modelsMap[currentKey as `${string}:${string}`]
               : undefined
             const currentModelData = currentKey
               ? models.find((m) => `${m.providerID}:${m.id}` === currentKey)
               : undefined

             const variantOptions =
               currentModelData?.variants?.map((v) => v.id) ?? []
             const currentVariantValue = currentEntry?.variant ?? ''

             return (
               <NativeSelect
                 value={currentVariantValue}
                 onChange={(e) => {
                   if (projectId && sessionId && currentKey) {
                     const [providerId, modelId] = currentKey.split(':')
                     const val = e.target.value || undefined
                     setSessionModelVariant(
                       projectId,
                       sessionId,
                       providerId,
                       modelId,
                       val
                     )
                   }
                 }}
                 disabled={isProcessing}
                 className="h-8 min-w-[110px] text-xs"
               >
                 <NativeSelectOption value="">—</NativeSelectOption>
                 {variantOptions.map((v) => (
                   <NativeSelectOption key={v} value={v}>
                     {v}
                   </NativeSelectOption>
                 ))}
               </NativeSelect>
             )
           })()}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t p-3">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className="flex-1"
        />
        {isProcessing ? (
          <Button
            variant="destructive"
            size="icon"
            onClick={() => void handleAbort()}
            disabled={abortPromptMutation.isPending}
            title="Abort"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </main>
  )
}
