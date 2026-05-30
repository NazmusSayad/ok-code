import { cn } from '@/lib/utils'
import type { Message, Part, ToolPart } from '@opencode-ai/sdk/v2'
import { ArrowDown, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  normalizeWheelDelta,
  shouldMarkBoundaryGesture,
} from '../utils/message-gesture'
import {
  constructTimelineRows,
  ContextToolGroup,
  DiffChanges,
  FilePartDisplay,
  isContextGroupTool,
  MessageDivider,
  ReasoningPartDisplay,
  SummaryDiff,
  TextPartDisplay,
  TextShimmer,
  timelineRowKey,
  toolDefaultOpen,
  ToolPartDisplay,
  type PartGroup,
  type TimelineRow,
} from './message-parts'

interface MessagesListProps {
  messages: { info: Message; parts: Part[] }[]
  isLoading: boolean
  loadError: Error | null
  isProcessing: boolean
  // Session header
  sessionTitle?: string | null
  isWorking?: boolean
}

const SCROLL_GESTURE_WINDOW_MS = 250
const BOTTOM_THRESHOLD_PX = 4

/**
 * Scroll state tracking matching OpenCode:
 * overflow: whether scroll container can scroll
 * bottom: whether currently scrolled to bottom
 * jump: whether scroll is far from bottom (show jump button)
 */
function useScrollState() {
  const [state, setState] = useState({
    overflow: false,
    bottom: true,
    jump: false,
    userScrolled: false,
  })

  const update = useCallback((el: HTMLDivElement) => {
    const max = el.scrollHeight - el.clientHeight
    const distance = max - el.scrollTop
    const overflow = max > 1
    const bottom = !overflow || distance <= BOTTOM_THRESHOLD_PX
    const jump = overflow && distance > Math.max(400, el.clientHeight)

    setState((prev) => {
      if (
        prev.overflow === overflow &&
        prev.bottom === bottom &&
        prev.jump === jump
      )
        return prev
      return { ...prev, overflow, bottom, jump }
    })
  }, [])

  const setUserScrolled = useCallback((value: boolean) => {
    setState((prev) =>
      prev.userScrolled === value ? prev : { ...prev, userScrolled: value }
    )
  }, [])

  return { ...state, update, setUserScrolled }
}

/**
 * Auto-scroll behavior matching OpenCode:
 * - Automatically scroll to bottom on new messages
 * - Pause auto-scroll when user scrolls up
 * - Resume auto-scroll when user reaches bottom or clicks jump-to-bottom
 */
function useAutoScroll(
  shouldAnchor: boolean,
  scrollRef: React.RefObject<HTMLDivElement | null>
) {
  const lastAnchorRef = useRef(shouldAnchor)

  useEffect(() => {
    if (!shouldAnchor) {
      lastAnchorRef.current = false
      return
    }
    if (!lastAnchorRef.current) {
      // Transition to anchoring: scroll immediately without animation
      lastAnchorRef.current = true
      const el = scrollRef.current
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    }
  }, [shouldAnchor, scrollRef])
}

function useTimelineCache() {
  const prevRef = useRef<{
    messages: { info: Message; parts: Part[] }[]
    rows: TimelineRow[]
  } | null>(null)

  const getStableRows = useCallback(
    (messages: { info: Message; parts: Part[] }[], isProcessing: boolean) => {
      const prev = prevRef.current
      if (
        prev &&
        prev.messages.length === messages.length &&
        prev.messages.every((m, i) => m.info.id === messages[i]?.info.id) &&
        prev.rows.length > 0
      ) {
        // Reuse existing rows if messages haven't changed
        return prev.rows
      }
      const next = constructTimelineRows(messages, isProcessing)
      prevRef.current = { messages, rows: next }
      return next
    },
    []
  )

  return getStableRows
}

export function MessagesList({
  messages,
  isLoading,
  loadError,
  isProcessing,
  sessionTitle,
  isWorking = false,
}: MessagesListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const gestureRef = useRef(0)
  const scrollState = useScrollState()
  const [historyShift, setHistoryShift] = useState(false)

  const getStableRows = useTimelineCache()
  const rows = useMemo(
    () => getStableRows(messages, isProcessing),
    [messages, isProcessing, getStableRows]
  )

  const isMeasuredBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return true
    return (
      el.scrollHeight - el.clientHeight - el.scrollTop <= BOTTOM_THRESHOLD_PX
    )
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  function markScrollGesture(target?: EventTarget | null) {
    const root = scrollRef.current
    if (!root) return
    const el = target instanceof Element ? target : undefined
    const nested = el?.closest('[data-scrollable]')
    if (nested && nested !== root) return
    gestureRef.current = Date.now()
  }

  function hasScrollGesture() {
    return Date.now() - gestureRef.current < SCROLL_GESTURE_WINDOW_MS
  }

  function shouldAnchorBottom() {
    return !scrollState.userScrolled && !hasScrollGesture()
  }

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return

    scrollState.update(el)

    const nearBottom = isMeasuredBottom()
    if (!nearBottom) {
      scrollState.setUserScrolled(true)
    } else {
      scrollState.setUserScrolled(false)
    }
  }

  function handleWheel(e: React.WheelEvent) {
    const el = scrollRef.current
    if (!el) return

    const delta = normalizeWheelDelta({
      deltaY: e.deltaY,
      deltaMode: e.deltaMode,
      rootHeight: el.clientHeight,
    })

    if (!delta) return

    const targetEl = e.target instanceof Element ? e.target : undefined
    const nested = targetEl?.closest('[data-scrollable]')

    if (nested && nested !== el) {
      if (
        shouldMarkBoundaryGesture({
          delta,
          scrollTop: (nested as HTMLElement).scrollTop,
          scrollHeight: nested.scrollHeight,
          clientHeight: (nested as HTMLElement).clientHeight,
        })
      ) {
        markScrollGesture(el)
      }
      return
    }

    markScrollGesture(el)
  }

  function handleTouchStart(_e: React.TouchEvent) {
    // Touch is handled via scroll event
  }

  function handleTouchMove(_e: React.TouchEvent) {
    // Touch is handled via scroll event
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.target !== e.currentTarget) return
    markScrollGesture(e.currentTarget)
  }

  function handleResumeScroll() {
    scrollState.setUserScrolled(false)
    scrollToBottom('smooth')
  }

  // Track scroll state on mount and when rows change
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    scrollState.update(el)
  }, [rows, scrollState])

  // Auto-scroll to bottom when new messages arrive
  useAutoScroll(shouldAnchorBottom(), scrollRef)

  // When rows change while anchored, scroll to bottom
  useEffect(() => {
    if (shouldAnchorBottom() && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [rows])

  // Track history shift (for older message loading)
  useEffect(() => {
    let frame: number | undefined
    if (historyShift) {
      frame = requestAnimationFrame(() => {
        setHistoryShift(false)
      })
    }
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [historyShift])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          <span data-component="session-messages-loading">
            Loading messages…
          </span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive text-sm">{loadError.message}</p>
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground py-8 text-center text-sm">
          No messages yet. Send a prompt below to start.
        </p>
      </div>
    )
  }

  const showHeader = sessionTitle != null && sessionTitle !== undefined

  const tint = '#10b981' // Emerald-500 for progress bar

  return (
    <div className="relative h-full w-full min-w-0">
      {/* Jump-to-bottom button */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-200 ease-out',
          scrollState.overflow && scrollState.jump
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-2 scale-95 opacity-0'
        )}
      >
        <button
          className="group pointer-events-auto flex h-8 w-10 cursor-pointer items-center justify-center border-none bg-transparent p-0"
          onClick={handleResumeScroll}
          data-component="session-scroll-jump"
        >
          <div className="border-border/60 bg-background/80 group-hover:border-border group-hover:bg-accent flex h-6 w-8 items-center justify-center rounded-md border backdrop-blur-sm transition-colors">
            <ArrowDown className="size-3.5" />
          </div>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="better-scrollbar h-full w-full overflow-auto"
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onPointerDown={handlePointerDown}
        data-slot="session-messages-scroll"
      >
        {/* Session Header */}
        {showHeader && (
          <div
            data-session-title
            className="bg-background/80 sticky top-0 z-30 pt-2 pr-3 pb-4 pl-2 md:pr-3 md:pl-4"
            style={{
              background:
                'linear-gradient(to bottom, var(--background) 48px, transparent)',
            }}
          >
            <div className="flex h-12 w-full items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 pr-3">
                {isWorking && (
                  <div className="mr-2 flex shrink-0 items-center justify-center overflow-hidden transition-all duration-300">
                    <Loader2
                      className="text-primary size-4 animate-spin"
                      style={{ color: tint || 'var(--primary)' }}
                    />
                  </div>
                )}
                <h1
                  className="text-foreground min-w-0 grow-1 truncate text-sm leading-normal font-medium"
                  data-slot="session-title-child"
                >
                  {sessionTitle}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Rows */}
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
  switch (row._tag) {
    case 'BottomSpacer': {
      return (
        <div
          data-timeline-row="bottom-spacer"
          aria-hidden="true"
          className="h-16"
        />
      )
    }

    case 'CommentStrip': {
      // Not yet supported in ok-code - always empty
      return null
    }

    case 'UserMessage': {
      const userMsg = messages.find(
        (m) => m.info.id === row.userMessageID && m.info.role === 'user'
      )
      if (!userMsg) return null

      const previousUserMessage = row.previousUserMessage

      return (
        <div
          id={`message-${row.userMessageID}`}
          data-message-id={row.userMessageID}
          data-timeline-row="UserMessage"
          className={cn(
            'w-full max-w-full min-w-0',
            previousUserMessage && 'pt-6'
          )}
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
            <div
              data-slot="session-turn-message-container"
              className="w-full px-4 md:px-5"
            >
              <div data-slot="session-turn-message-content" aria-live="off">
                <UserMessageDisplay
                  message={
                    userMsg.info as import('@opencode-ai/sdk/v2').UserMessage
                  }
                  parts={userMsg.parts}
                />
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'TurnDivider': {
      const label =
        row.label === 'compaction' ? 'Context compacted' : 'Interrupted'
      return (
        <div
          data-message-id={row.userMessageID}
          data-timeline-row="TurnDivider"
          className="w-full max-w-full min-w-0"
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
            <div
              data-slot="session-turn-message-container"
              className="w-full px-4 md:px-5"
            >
              <div data-slot="session-turn-compaction">
                <MessageDivider label={label} />
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'AssistantPart': {
      const previousAssistantPart = row.previousAssistantPart

      return (
        <div
          data-message-id={row.userMessageID}
          data-timeline-row="AssistantPart"
          className={cn(
            'w-full max-w-full min-w-0',
            previousAssistantPart && 'pt-3'
          )}
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
            <div
              data-slot="session-turn-message-container"
              className="w-full px-4 md:px-5"
            >
              <div data-slot="session-turn-assistant-content">
                <AssistantPartRenderer group={row.group} messages={messages} />
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'Thinking': {
      return (
        <div
          data-message-id={row.userMessageID}
          data-timeline-row="Thinking"
          className="w-full max-w-full min-w-0"
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
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
          </div>
        </div>
      )
    }

    case 'Retry': {
      return (
        <div
          data-message-id={row.userMessageID}
          data-timeline-row="Retry"
          className="w-full max-w-full min-w-0"
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
            <div
              data-slot="session-turn-message-container"
              className="w-full px-4 md:px-5"
            >
              <div
                data-component="session-retry"
                className="flex items-center gap-2 py-1 text-sm text-amber-500"
              >
                <Loader2 className="size-3.5 animate-spin" />
                <span>Retrying…</span>
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'DiffSummary': {
      const diffs = row.diffs
      if (diffs.length === 0) return null

      return (
        <div
          data-message-id={row.userMessageID}
          data-timeline-row="DiffSummary"
          className="w-full max-w-full min-w-0"
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
            <div
              data-slot="session-turn-message-container"
              className="w-full px-4 md:px-5"
            >
              <DiffSummaryRow diffs={diffs} />
            </div>
          </div>
        </div>
      )
    }

    case 'Error': {
      return (
        <div
          data-message-id={row.userMessageID}
          data-timeline-row="Error"
          className="w-full max-w-full min-w-0"
        >
          <div
            data-component="session-turn"
            className="relative w-full min-w-0"
            style={{ height: 'auto' }}
          >
            <div
              data-slot="session-turn-message-container"
              className="w-full px-4 md:px-5"
            >
              <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
                {row.text}
              </div>
            </div>
          </div>
        </div>
      )
    }

    default: {
      const _exhaustive: never = row
      void _exhaustive
      return null
    }
  }
}

function DiffSummaryRow({ diffs }: { diffs: SummaryDiff[] }) {
  const maxFiles = 10
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? diffs : diffs.slice(0, maxFiles)
  const overflow = Math.max(0, diffs.length - maxFiles)

  return (
    <div
      data-slot="session-turn-diffs"
      data-component="session-turn-diffs-group"
    >
      <div
        data-slot="session-turn-diffs-header"
        className="mb-2 flex items-center justify-between"
      >
        <span
          data-slot="session-turn-diffs-label"
          className="text-foreground text-sm font-medium"
        >
          {diffs.length} file{diffs.length === 1 ? '' : 's'} changed
        </span>
        <DiffChanges
          additions={diffs.reduce((sum, d) => sum + (d.additions ?? 0), 0)}
          deletions={diffs.reduce((sum, d) => sum + (d.deletions ?? 0), 0)}
        />
        {overflow > 0 && (
          <button
            data-slot="session-turn-diffs-toggle"
            className="text-muted-foreground hover:text-foreground ml-2 cursor-pointer border-none bg-transparent text-xs transition-colors"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `Show all`}
          </button>
        )}
      </div>
      <div data-component="session-turn-diffs-content" className="space-y-0">
        {visible.map((diff) => (
          <div
            key={diff.file}
            data-slot="session-turn-diff-item"
            className="hover:bg-accent/50 flex items-center justify-between rounded-sm px-2 py-1.5"
          >
            <span
              data-slot="session-turn-diff-path"
              className="truncate text-sm"
            >
              {diff.file}
            </span>
            <DiffChanges
              additions={diff.additions}
              deletions={diff.deletions}
            />
          </div>
        ))}
      </div>
      {!showAll && overflow > 0 && (
        <div
          data-slot="session-turn-diffs-more"
          className="text-muted-foreground hover:text-foreground mt-1 cursor-pointer text-xs transition-colors"
          onClick={() => setShowAll(true)}
        >
          +{overflow} more
        </div>
      )}
    </div>
  )
}

function UserMessageDisplay({
  message,
  parts,
}: {
  message: import('@opencode-ai/sdk/v2').UserMessage
  parts: Part[]
}) {
  const textPart = parts.find(
    (p) =>
      p.type === 'text' &&
      !(
        'synthetic' in (p as unknown as Record<string, unknown>) &&
        (p as unknown as Record<string, unknown>).synthetic
      )
  ) as import('@opencode-ai/sdk/v2').TextPart | undefined
  const text = textPart?.text || ''

  const created = (message as unknown as { time?: { created?: number } }).time
    ?.created
  const timeStr = created
    ? new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(created)
    : ''

  return (
    <div
      data-component="user-message"
      className="flex w-full flex-col items-end gap-0 self-stretch"
    >
      {text && (
        <div
          data-slot="user-message-body"
          className="max-w-min(82%,64ch) ml-auto flex w-fit flex-col items-end"
        >
          <div
            data-slot="user-message-text"
            className="border-border bg-muted/5 inline-block max-w-full overflow-hidden rounded-md border px-3 py-2 text-sm break-words whitespace-pre-wrap"
          >
            {text}
          </div>
        </div>
      )}
      {timeStr && (
        <span className="text-muted-foreground mt-1 text-[12px]">
          {timeStr}
        </span>
      )}
    </div>
  )
}

function AssistantPartRenderer({
  group,
  messages,
}: {
  group: PartGroup
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

  if (part.type === 'tool') {
    const defaultOpen = toolDefaultOpen(part.tool)
    return <ToolPartDisplay part={part} defaultOpen={defaultOpen} />
  }

  switch (part.type) {
    case 'text':
      return <TextPartDisplay part={part} message={message} />
    case 'reasoning':
      return <ReasoningPartDisplay part={part} message={message} />
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
