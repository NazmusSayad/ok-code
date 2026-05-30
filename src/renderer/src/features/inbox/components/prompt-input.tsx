import { Send, Square } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'

interface PromptInputProps {
  input: string
  setInput: (value: string) => void
  isProcessing: boolean
  onSend: () => void
  onAbort: () => void
  abortPending: boolean
  onKeyDown: (e: React.KeyboardEvent<Element>) => void
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
    <div className="flex items-center gap-2 border-t p-3">
      <Input
        placeholder="Type a message..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isProcessing}
        className="flex-1"
      />
      {isProcessing ? (
        <Button
          variant="destructive"
          size="icon"
          onClick={onAbort}
          disabled={abortPending}
          title="Abort"
        >
          <Square className="size-4" />
        </Button>
      ) : (
        <Button
          variant="default"
          size="icon"
          onClick={onSend}
          disabled={!input.trim()}
          title="Send"
        >
          <Send className="size-4" />
        </Button>
      )}
    </div>
  )
}
