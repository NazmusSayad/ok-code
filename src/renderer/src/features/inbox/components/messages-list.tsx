import type { Message, Part } from '@opencode-ai/sdk/v2'
import { Loader2 } from 'lucide-react'
import { MessageItem } from './message-item'

interface MessagesListProps {
  messages: { info: Message; parts: Part[] }[]
  isLoading: boolean
  loadError: Error | null
  isProcessing: boolean
}

export function MessagesList({
  messages,
  isLoading,
  loadError,
  isProcessing,
}: MessagesListProps) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading messages...
      </div>
    )
  }

  if (loadError) {
    return <p className="text-destructive text-sm">{loadError.message}</p>
  }

  if (!messages || messages.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No messages yet. Send a prompt below to start.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <MessageItem key={msg.info.id} msg={msg} />
      ))}
      {isProcessing && (
        <div className="text-muted-foreground bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <Loader2 className="size-3.5 animate-spin" />
          Processing…
        </div>
      )}
    </div>
  )
}
