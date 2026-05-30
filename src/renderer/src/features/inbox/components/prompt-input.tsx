import { Loader2, Send, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/ui/button'

interface PromptInputProps {
  input: string
  setInput: (value: string) => void
  isProcessing: boolean
  onSend: () => void
  onAbort: () => void
  abortPending: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
  placeholder?: string
}

export function PromptInput({
  input,
  setInput,
  isProcessing,
  onSend,
  onAbort,
  abortPending,
  onKeyDown,
  disabled = false,
  placeholder = 'Ask anything, / for commands, @ for context…',
}: PromptInputProps) {
  const [composing, setComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isImeComposing = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      return composing || event.keyCode === 229
    },
    [composing]
  )

  // Auto-adjust textarea height
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [input])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle Escape: abort if processing
      if (event.key === 'Escape') {
        if (isProcessing) {
          event.preventDefault()
          onAbort()
          return
        }
        return
      }

      // Shift+Enter always inserts newline
      if (event.key === 'Enter' && event.shiftKey) {
        // Let default happen - insert newline
        return
      }

      // Enter without Shift sends message (unless IME composing)
      if (event.key === 'Enter' && !event.shiftKey) {
        if (isImeComposing(event)) {
          // Let IME handle the Enter key
          event.preventDefault()
          return
        }
        event.preventDefault()
        onSend()
        return
      }

      // Call external handler if provided
      onKeyDown?.(event)
    },
    [isProcessing, onAbort, isImeComposing, onSend, onKeyDown]
  )

  const handleCompositionStart = useCallback(() => {
    setComposing(true)
  }, [])

  const handleCompositionEnd = useCallback(() => {
    setComposing(false)
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value)
    },
    [setInput]
  )

  return (
    <div className="border-t px-3 pt-2 pb-3">
      <div className="bg-background focus-within:border-ring/70 flex items-end gap-2 rounded-2xl border px-2 py-1.5 shadow-sm transition-colors">
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          autoFocus
          disabled={disabled}
          rows={1}
          className="placeholder:text-muted-foreground max-h-[180px] min-h-[20px] flex-1 resize-none bg-transparent px-3 py-1 text-sm leading-snug outline-none"
        />
        {isProcessing ? (
          <Button
            variant="destructive"
            size="icon"
            className="size-8 shrink-0 rounded-xl"
            onClick={onAbort}
            disabled={abortPending}
            title="Abort"
            data-action="prompt-abort"
          >
            {abortPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Square className="size-3.5" />
            )}
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            className="size-8 shrink-0 rounded-xl"
            onClick={onSend}
            disabled={!input.trim() || disabled}
            title="Send"
            data-action="prompt-send"
          >
            <Send className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
