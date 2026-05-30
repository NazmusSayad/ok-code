import type { Message, Part } from '@opencode-ai/sdk/v2'

interface MessageItemProps {
  msg: { info: Message; parts: Part[] }
}

export function MessageItem({ msg }: MessageItemProps) {
  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        msg.info.role === 'assistant' ? 'bg-muted/30' : 'bg-background'
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
        <span>{new Date(msg.info.time.created * 1000).toLocaleString()}</span>
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
                <p key={idx} className="text-xs text-muted-foreground">
                  [{part.type}]
                </p>
              )
          }
        })}
      </div>
    </div>
  )
}
