import { Send, Square } from 'lucide-react'
import { Button } from '../../../components/ui/button'

interface PromptInputProps {
  input: string
  setInput: (value: string) => void
  isProcessing: boolean
  onSend: () => void
  onAbort: () => void
  abortPending: boolean
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function PromptInput({
  input,
  setInput,
  isProcessing,
  onSend,
  onAbort,
  abortPending,
  onKeyDown,
}: PromptInputProps) {
  return (
    <div className="border-t px-3 pt-2 pb-3">
      <div className="bg-background focus-within:border-ring/70 flex items-end gap-2 rounded-2xl border px-2 py-1.5 shadow-sm transition-colors">
        <textarea
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          className="placeholder:text-muted-foreground max-h-[140px] min-h-[20px] flex-1 resize-y bg-transparent px-3 py-1 text-sm leading-snug outline-none"
        />
        {isProcessing ? (
          <Button
            variant="destructive"
            size="icon"
            className="size-8 shrink-0 rounded-xl"
            onClick={onAbort}
            disabled={abortPending}
            title="Abort"
          >
            <Square className="size-3.5" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            className="size-8 shrink-0 rounded-xl"
            onClick={onSend}
            disabled={!input.trim()}
            title="Send"
          >
            <Send className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
