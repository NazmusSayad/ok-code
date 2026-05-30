import type { Message, Part } from '@opencode-ai/sdk/v2'
import { File, Wrench } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageItemProps {
  msg: { info: Message; parts: Part[] }
}

export function MessageItem({ msg }: MessageItemProps) {
  const role = msg.info.role
  const created = new Date(msg.info.time.created * 1000)

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        role === 'assistant'
          ? 'bg-muted/30 border-border/60'
          : 'bg-background border-border/40'
      }`}
    >
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-[10px]">
        <span className="font-medium tracking-wide uppercase">
          {role === 'user' ? 'You' : 'Assistant'}
        </span>
        <span className="opacity-60">·</span>
        <time className="tabular-nums opacity-60">
          {created.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
          {created.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </div>

      <div className="space-y-2">
        {msg.parts.map((part, idx) => {
          switch (part.type) {
            case 'text':
              return (
                <div key={idx} className="chat-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              )
            case 'reasoning':
              return (
                <div
                  key={idx}
                  className="border-muted-foreground/40 bg-muted/20 text-muted-foreground rounded-md border-l-2 py-1 pl-3 text-[12px] italic"
                >
                  {part.text}
                </div>
              )
            case 'tool': {
              const s = part.state
              return (
                <div
                  key={idx}
                  className="bg-muted/20 rounded-lg border px-3 py-2 text-xs"
                >
                  <div className="text-muted-foreground flex items-center gap-1.5">
                    <Wrench className="size-3" />
                    <span className="text-foreground font-medium">
                      {part.tool}
                    </span>
                    <span className="opacity-50">·</span>
                    <span className="text-[10px] tracking-wider uppercase">
                      {s.status}
                    </span>
                  </div>
                  {s.status === 'completed' && 'output' in s && s.output && (
                    <div className="text-muted-foreground/90 mt-1.5 line-clamp-3 font-mono text-[11px]">
                      {s.output}
                    </div>
                  )}
                  {s.status === 'error' && 'error' in s && (
                    <div className="text-destructive/90 mt-1">{s.error}</div>
                  )}
                </div>
              )
            }
            case 'file':
              return (
                <div
                  key={idx}
                  className="bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs"
                >
                  <File className="size-3.5" />
                  <span>{part.filename || part.url || 'file'}</span>
                </div>
              )
            case 'step-finish':
              return (
                <div key={idx} className="text-muted-foreground/70 text-[10px]">
                  Step complete · {part.tokens.output} tokens · $
                  {part.cost.toFixed(4)}
                </div>
              )
            case 'retry':
              return (
                <div key={idx} className="text-destructive/80 text-xs">
                  Retry #{part.attempt} failed:{' '}
                  {part.error?.data?.message || 'error'}
                </div>
              )
            case 'compaction':
              return (
                <div
                  key={idx}
                  className="text-muted-foreground/70 text-[10px] italic"
                >
                  Context compacted
                </div>
              )
            default:
              return null // hide internal parts for clean UI
          }
        })}
      </div>
    </div>
  )
}
