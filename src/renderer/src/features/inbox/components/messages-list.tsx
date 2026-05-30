import { cn } from '@/lib/utils'
import type { Message, Part, ToolPart, UserMessage } from '@opencode-ai/sdk/v2'
import { ArrowDown, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  constructTimelineRows,
  ContextToolGroup,
  FilePartDisplay,
  isContextGroupTool,
  MessageDivider,
  ReasoningPartDisplay,
  TextPartDisplay,
  TextShimmer,
  timelineRowKey,
  toolDefaultOpen,
  ToolPartDisplay,
  UserMessageDisplay,
  type PartGroup,
  type TimelineRow,
} from './message-parts'

interface MessagesListProps {
  messages: { info: Message; parts: Part[] }[]
  isLoading: boolean
  loadError: Error | null
  isProcessing: boolean
}

const SCROLL_GESTURE_WINDOW_MS = 2000
const BOTTOM_THRESHOLD_PX = 4

export function MessagesList({
  messages,
  isLoading,
  loadError,
  isProcessing,
}: MessagesListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const [userScrolled, setUserScrolled] = useState(false)
  const [scrollGestureTime, setScrollGestureTime] = useState(0)
  const [showJumpButton, setShowJumpButton] = useState(false)

  const rows = useMemo(
    () => constructTimelineRows(messages, isProcessing),
    [messages, isProcessing]
  )

  const isMeasuredBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return true
    return (
      el.scrollHeight - el.clientHeight - el.scrollTop <= BOTTOM_THRESHOLD_PX
    )
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  function markScrollGesture(target?: EventTarget | null) {
    const root = scrollRef.current
    if (!root) return
    const el = target instanceof Element ? target : undefined
    const nested = el?.closest('[data-scrollable]')
    if (nested && nested !== root) return
    setScrollGestureTime(Date.now())
  }

  function hasScrollGesture() {
    return Date.now() - scrollGestureTime < SCROLL_GESTURE_WINDOW_MS
  }

  function shouldAnchorBottom() {
    return !userScrolled && !hasScrollGesture()
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    markScrollGesture(el)
    const nearBottom = isMeasuredBottom()
    if (!nearBottom) {
      setUserScrolled(true)
    } else {
      setUserScrolled(false)
    }
    setShowJumpButton(!nearBottom)
  }

  function handleWheel(e: React.WheelEvent) {
    markScrollGesture(e.target)
  }

  function handleTouchStart(e: React.TouchEvent) {
    markScrollGesture(e.target)
  }

  function handleResumeScroll() {
    setUserScrolled(false)
    scrollToBottom('smooth')
  }

  useEffect(() => {
    if (shouldAnchorBottom()) {
      scrollToBottom('smooth')
    }
  }, [messages?.length, isProcessing])

  useEffect(() => {
    if (shouldAnchorBottom() && isMeasuredBottom()) {
      scrollToBottom('smooth')
    }
  }, [rows])

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
    <div className="relative h-full w-full min-w-0">
      {showJumpButton && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200 ease-out">
          <button
            className="group pointer-events-auto flex h-8 w-10 cursor-pointer items-center justify-center border-none bg-transparent p-0"
            onClick={handleResumeScroll}
          >
            <div className="border-border/60 bg-background/80 group-hover:border-border group-hover:bg-accent flex h-6 w-8 items-center justify-center rounded-md border backdrop-blur-sm transition-colors">
              <ArrowDown className="size-3.5" />
            </div>
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="better-scrollbar h-full w-full overflow-auto"
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
      >
        {rows.map((row) => (
          <TimelineRowView
            key={timelineRowKey(row)}
            row={row}
            messages={messages}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

function TimelineRowView({
  row,
  messages,
}: {
  row: TimelineRow
  messages: { info: Message; parts: Part[] }[]
}) {
  if (row._tag === 'BottomSpacer') {
    return (
      <div
        data-timeline-row="bottom-spacer"
        aria-hidden="true"
        className="h-16"
      />
    )
  }

  const previousUserMessage =
    row._tag === 'UserMessage' && row.previousUserMessage
  const previousAssistantPart =
    row._tag === 'AssistantPart' && row.previousAssistantPart

  return (
    <div
      data-message-id={row.userMessageID}
      data-timeline-row={row._tag}
      className={cn(
        'w-full max-w-full min-w-0',
        previousUserMessage && 'pt-6',
        previousAssistantPart && 'pt-3'
      )}
    >
      <div
        data-component="session-turn"
        className="relative w-full min-w-0"
        style={{ height: 'auto' }}
      >
        <TimelineRowContent row={row} messages={messages} />
      </div>
    </div>
  )
}

function TimelineRowContent({
  row,
  messages,
}: {
  row: TimelineRow
  messages: { info: Message; parts: Part[] }[]
}) {
  const messageById = useMemo(
    () => new Map(messages.map((m) => [m.info.id, m])),
    [messages]
  )

  switch (row._tag) {
    case 'UserMessage': {
      const userMsg = messageById.get(row.userMessageID)
      if (!userMsg || userMsg.info.role !== 'user') return null
      return (
        <div
          data-slot="session-turn-message-container"
          className="w-full px-4 md:px-5"
        >
          <div data-slot="session-turn-message-content" aria-live="off">
            <UserMessageDisplay
              message={userMsg.info as UserMessage}
              parts={userMsg.parts}
            />
          </div>
        </div>
      )
    }

    case 'TurnDivider': {
      const label =
        row.label === 'compaction' ? 'Context compacted' : 'Interrupted'
      return (
        <div
          data-slot="session-turn-message-container"
          className="w-full px-4 md:px-5"
        >
          <div data-slot="session-turn-compaction">
            <MessageDivider label={label} />
          </div>
        </div>
      )
    }

    case 'AssistantPart': {
      return (
        <div
          data-slot="session-turn-message-container"
          className="w-full px-4 md:px-5"
        >
          <AssistantPartRenderer
            group={row.group}
            userMessageID={row.userMessageID}
            messages={messages}
          />
        </div>
      )
    }

    case 'Thinking': {
      return (
        <div
          data-slot="session-turn-message-container"
          className="w-full px-4 md:px-5"
        >
          <div
            data-slot="session-turn-thinking"
            className="flex items-center gap-2 py-1"
          >
            <TextShimmer text="Thinking…" active />
            {row.reasoningHeading && (
              <span className="text-muted-foreground text-[13px] italic">
                {row.reasoningHeading}
              </span>
            )}
          </div>
        </div>
      )
    }

    case 'Error': {
      return (
        <div
          data-slot="session-turn-message-container"
          className="w-full px-4 md:px-5"
        >
          <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
            {row.text}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}

function AssistantPartRenderer({
  group,
  messages,
}: {
  group: PartGroup
  userMessageID: string
  messages: { info: Message; parts: Part[] }[]
}) {
  const partsByMessage = useMemo(
    () => new Map(messages.map((m) => [m.info.id, m.parts])),
    [messages]
  )
  const messageById = useMemo(
    () => new Map(messages.map((m) => [m.info.id, m.info])),
    [messages]
  )

  if (group.type === 'context') {
    const toolParts = group.refs
      .map((ref) => {
        const parts = partsByMessage.get(ref.messageID)
        if (!parts) return undefined
        return parts.find((p) => p.id === ref.partID)
      })
      .filter(
        (p): p is ToolPart => !!p && p.type === 'tool' && isContextGroupTool(p)
      )

    return <ContextToolGroup parts={toolParts} busy={false} />
  }

  const part = partsByMessage
    .get(group.ref.messageID)
    ?.find((p) => p.id === group.ref.partID)
  const message = messageById.get(group.ref.messageID)
  if (!part || !message) return null

  return (
    <div data-slot="session-turn-assistant-content">
      <SinglePartRenderer part={part} message={message} />
    </div>
  )
}

function SinglePartRenderer({
  part,
  message,
}: {
  part: Part
  message: Message
}) {
  switch (part.type) {
    case 'text':
      return <TextPartDisplay part={part} message={message} />
    case 'reasoning':
      return <ReasoningPartDisplay part={part} message={message} />
    case 'tool':
      return (
        <ToolPartDisplay
          part={part as ToolPart}
          defaultOpen={toolDefaultOpen(part.tool)}
        />
      )
    case 'file':
      return (
        <FilePartDisplay
          part={part as import('@opencode-ai/sdk/v2').FilePart}
        />
      )
    default:
      return null
  }
}
