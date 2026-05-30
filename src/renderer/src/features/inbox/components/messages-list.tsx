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
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
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
      <p className="text-muted-foreground text-sm">
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
        <div className="bg-muted/30 text-muted-foreground flex items-center gap-2 rounded-lg border p-3 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  )
}
