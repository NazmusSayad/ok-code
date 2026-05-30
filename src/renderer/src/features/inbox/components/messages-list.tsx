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
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading messages...
      </div>
    )
  }

  if (loadError) {
    return <p className="text-sm text-destructive">{loadError.message}</p>
  }

  if (!messages || messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No messages in this session. Send one below.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <MessageItem key={msg.info.id} msg={msg} />
      ))}
      {isProcessing && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  )
}
