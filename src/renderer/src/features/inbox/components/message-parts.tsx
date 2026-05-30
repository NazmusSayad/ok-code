import { cn } from '@/lib/utils'
import type {
  AssistantMessage,
  FilePart,
  Message,
  Part,
  QuestionAnswer,
  QuestionInfo,
  ReasoningPart,
  TextPart,
  Todo,
  ToolPart,
  UserMessage,
} from '@opencode-ai/sdk/v2'
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  File,
  FileCode,
  FolderSearch,
  Globe,
  Loader2,
  Search,
  Terminal,
  Wrench,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../../components/ui/accordion'
import { Button } from '../../../components/ui/button'
import { Checkbox } from '../../../components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible'
import { Dialog, DialogContent } from '../../../components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip'
import {
  getToolInfo,
  isContextGroupTool,
  renderable,
  writeClipboard,
} from '../utils/message-parts'

export { isContextGroupTool, renderable } from '../utils/message-parts'

export function getFilename(path: string | undefined) {
  if (!path) return ''
  const parts = path.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || ''
}

export function getDirectory(path: string | undefined) {
  if (!path) return ''
  const normalized = path.replace(/\\/g, '/')
  const lastSlash = normalized.lastIndexOf('/')
  if (lastSlash <= 0) return ''
  return normalized.slice(0, lastSlash)
}

function formatDuration(ms: number) {
  const total = Math.round(ms / 1000)
  if (total < 60) return `${total}s`
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}m ${seconds}s`
}

export function toolDefaultOpen(tool: string) {
  if (tool === 'bash') return false
  if (tool === 'edit' || tool === 'write' || tool === 'apply_patch') return true
  return false
}

function useCopy(text?: string) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    if (!text) return
    void (async () => {
      if (await writeClipboard(text)) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    })()
  }, [text])
  return { copied, handleCopy }
}

export function TextShimmer({
  text,
  active,
}: {
  text: string
  active?: boolean
}) {
  if (!active) return <>{text}</>
  return (
    <span
      data-component="text-shimmer"
      data-active="true"
      className="text-foreground/50 inline-flex animate-pulse items-baseline"
    >
      {text}
    </span>
  )
}

export function MessageDivider({ label }: { label: string }) {
  return (
    <div data-component="compaction-part">
      <div
        data-slot="compaction-part-divider"
        className="flex items-center gap-3 py-2.5"
      >
        <span
          data-slot="compaction-part-line"
          className="bg-border h-px flex-1"
        />
        <span
          data-slot="compaction-part-label"
          className="text-muted-foreground text-xs whitespace-nowrap"
        >
          {label}
        </span>
        <span
          data-slot="compaction-part-line"
          className="bg-border h-px flex-1"
        />
      </div>
    </div>
  )
}

interface Diagnostic {
  range: {
    start: { line: number; character: number }
    end: { line: number; character: number }
  }
  message: string
  severity?: number
}

function getDiagnostics(
  diagnosticsByFile: Record<string, Diagnostic[]> | undefined,
  filePath: string | undefined
): Diagnostic[] {
  if (!diagnosticsByFile || !filePath) return []
  const diagnostics = diagnosticsByFile[filePath] ?? []
  return diagnostics.filter((d) => d.severity === 1).slice(0, 3)
}

function DiagnosticsDisplay({ diagnostics }: { diagnostics: Diagnostic[] }) {
  if (diagnostics.length === 0) return null
  return (
    <div data-component="diagnostics" className="mt-2 space-y-1">
      {diagnostics.map((d, i) => (
        <div
          key={i}
          data-slot="diagnostic"
          className="flex items-start gap-2 text-xs"
        >
          <span
            data-slot="diagnostic-label"
            className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 text-xs font-medium"
          >
            Error
          </span>
          <span
            data-slot="diagnostic-location"
            className="text-muted-foreground"
          >
            [{d.range.start.line + 1}:{d.range.start.character + 1}]
          </span>
          <span data-slot="diagnostic-message">{d.message}</span>
        </div>
      ))}
    </div>
  )
}

export function DiffChanges({
  additions,
  deletions,
}: {
  additions?: number
  deletions?: number
}) {
  if (additions === undefined && deletions === undefined) return null
  return (
    <span
      data-component="diff-changes"
      className="flex items-center gap-1.5 text-[11px] font-medium tabular-nums"
    >
      {additions !== undefined && additions > 0 && (
        <span
          data-slot="diff-changes-additions"
          className="text-emerald-600 dark:text-emerald-400"
        >
          +{additions}
        </span>
      )}
      {deletions !== undefined && deletions > 0 && (
        <span
          data-slot="diff-changes-deletions"
          className="text-red-600 dark:text-red-400"
        >
          -{deletions}
        </span>
      )}
    </span>
  )
}

function ToolFileAccordion({
  path,
  actions,
  children,
}: {
  path: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Accordion type="multiple" defaultValue={[path]} data-scope="apply-patch">
      <AccordionItem value={path}>
        <AccordionTrigger className="py-1.5 hover:no-underline">
          <div
            data-slot="apply-patch-trigger-content"
            className="flex min-w-0 flex-1 items-center justify-between gap-2"
          >
            <div
              data-slot="apply-patch-file-info"
              className="flex min-w-0 items-center gap-2"
            >
              <FileCode className="text-muted-foreground size-3.5 shrink-0" />
              <div
                data-slot="apply-patch-file-name-container"
                className="min-w-0"
              >
                {path.includes('/') && (
                  <span
                    data-slot="apply-patch-directory"
                    className="text-muted-foreground text-xs"
                  >
                    {`\u202A${getDirectory(path)}\u202C`}
                  </span>
                )}
                <span
                  data-slot="apply-patch-filename"
                  className="text-sm font-medium"
                >
                  {getFilename(path)}
                </span>
              </div>
            </div>
            <div
              data-slot="apply-patch-trigger-actions"
              className="flex shrink-0 items-center gap-1.5"
            >
              {actions}
              <ChevronDown className="text-muted-foreground size-3" />
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export interface TriggerTitle {
  title: string
  titleClass?: string
  subtitle?: string
  subtitleClass?: string
  args?: string[]
  argsClass?: string
  action?: React.ReactNode
}

function isTriggerTitle(val: unknown): val is TriggerTitle {
  return typeof val === 'object' && val !== null && 'title' in val
}

interface ToolCardProps {
  icon: React.ReactNode
  trigger: TriggerTitle | React.ReactNode
  children?: React.ReactNode
  status?: string
  hideDetails?: boolean
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  forceOpen?: boolean
  locked?: boolean
  animated?: boolean
  onSubtitleClick?: () => void
  triggerHref?: string
  clickable?: boolean
  onTriggerClick?: (e: React.MouseEvent) => void
}

export function ToolCard({
  icon,
  trigger,
  children,
  status,
  hideDetails,
  defaultOpen,
  open: controlledOpen,
  onOpenChange,
  locked,
  onSubtitleClick,
  triggerHref,
  clickable,
  onTriggerClick,
}: ToolCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const pending = status === 'pending' || status === 'running'
  const hasChildren = !!children

  function handleOpenChange(value: boolean) {
    if (pending) return
    if (locked && !value) return
    if (controlledOpen === undefined) setInternalOpen(value)
    onOpenChange?.(value)
  }

  const hasTriggerTitle = isTriggerTitle(trigger)

  const triggerContent = (
    <div
      data-component="tool-trigger"
      data-clickable={clickable ? 'true' : undefined}
      className="flex w-full items-center gap-0"
    >
      <div
        data-slot="basic-tool-tool-trigger-content"
        className="flex min-w-0 flex-1 items-center"
      >
        <div data-slot="basic-tool-tool-info" className="min-w-0 flex-1">
          {hasTriggerTitle ? (
            <div data-slot="basic-tool-tool-info-structured">
              <div
                data-slot="basic-tool-tool-info-main"
                className="flex min-w-0 items-center gap-0"
              >
                <span
                  data-slot="basic-tool-tool-title"
                  className={cn(
                    'shrink-0 text-sm leading-normal font-medium',
                    (trigger as TriggerTitle).titleClass
                  )}
                >
                  <TextShimmer
                    text={(trigger as TriggerTitle).title}
                    active={pending}
                  />
                </span>
                {!pending && (trigger as TriggerTitle).subtitle && (
                  <span
                    data-slot="basic-tool-tool-subtitle"
                    className={cn(
                      'text-foreground/60 min-w-0 shrink truncate text-sm leading-normal font-normal tabular-nums',
                      onSubtitleClick && 'cursor-pointer underline',
                      (trigger as TriggerTitle).subtitleClass
                    )}
                    onClick={(e) => {
                      if (onSubtitleClick) {
                        e.stopPropagation()
                        onSubtitleClick()
                      }
                    }}
                  >
                    {(trigger as TriggerTitle).subtitle}
                  </span>
                )}
                {!pending &&
                  (trigger as TriggerTitle).args?.map((arg, i) => (
                    <span
                      key={i}
                      data-slot="basic-tool-tool-arg"
                      className={cn(
                        'text-foreground/60 min-w-0 shrink truncate text-sm leading-normal font-normal tabular-nums',
                        (trigger as TriggerTitle).argsClass
                      )}
                    >
                      {arg}
                    </span>
                  ))}
              </div>
              {!pending && (trigger as TriggerTitle).action && (
                <span data-slot="basic-tool-tool-action">
                  {(trigger as TriggerTitle).action}
                </span>
              )}
            </div>
          ) : (
            <>{trigger}</>
          )}
        </div>
      </div>
      {hasChildren && !hideDetails && !locked && !pending && (
        <CollapsibleArrow open={isOpen} />
      )}
    </div>
  )

  const TriggerElement = triggerHref ? 'a' : 'div'

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="tool-collapsible w-full rounded-md"
    >
      <CollapsibleTrigger className="text-foreground/70 hover:text-foreground/90 flex h-8 w-full items-center px-0 text-left text-[13px] leading-normal font-medium transition-colors">
        <TriggerElement
          {...(triggerHref
            ? {
                href: triggerHref,
                target: '_blank',
                rel: 'noopener noreferrer',
              }
            : {})}
          className="flex min-w-0 flex-1 items-center gap-2"
          onClick={onTriggerClick}
        >
          {icon}
          {triggerContent}
        </TriggerElement>
      </CollapsibleTrigger>

      {hasChildren && !hideDetails && (
        <CollapsibleContent>
          <div className="overflow-hidden">{children}</div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

function CollapsibleArrow({ open }: { open: boolean }) {
  return (
    <span
      data-slot="collapsible-arrow"
      className="flex h-6 w-6 shrink-0 items-center justify-center opacity-0 transition-opacity group-hover/tool:opacity-100 [[data-state=open]>&]:opacity-100"
    >
      <span
        data-slot="collapsible-arrow-icon"
        className={cn(
          'text-muted-foreground/50 inline-flex transition-transform duration-150',
          open ? 'rotate-0' : '-rotate-90'
        )}
      >
        <ChevronDown className="size-3" />
      </span>
    </span>
  )
}

export function GenericTool({
  tool,
  status,
  hideDetails,
  input,
}: {
  tool: string
  status?: string
  hideDetails?: boolean
  input?: Record<string, unknown>
}) {
  const labelKeys = [
    'description',
    'query',
    'url',
    'filePath',
    'path',
    'pattern',
    'name',
  ]
  const subtitle = labelKeys
    .map((key) => input?.[key])
    .find(
      (value): value is string => typeof value === 'string' && value.length > 0
    )

  const skipKeys = new Set(labelKeys)
  const args = Object.entries(input ?? {})
    .filter(([key]) => !skipKeys.has(key))
    .flatMap(([key, value]) => {
      if (typeof value === 'string') return [`${key}=${value}`]
      if (typeof value === 'number') return [`${key}=${value}`]
      if (typeof value === 'boolean') return [`${key}=${value}`]
      return []
    })
    .slice(0, 3)

  return (
    <ToolCard
      icon={<Wrench className="text-muted-foreground size-3.5 shrink-0" />}
      trigger={{ title: `Called ${tool}`, subtitle, args }}
      status={status}
      hideDetails={hideDetails}
    />
  )
}

export interface PartRef {
  messageID: string
  partID: string
}

export type PartGroup =
  | { key: string; type: 'part'; ref: PartRef }
  | { key: string; type: 'context'; refs: PartRef[] }

function groupParts(parts: { messageID: string; part: Part }[]): PartGroup[] {
  const result: PartGroup[] = []
  let start = -1

  function flush(end: number) {
    if (start < 0) return
    const first = parts[start]
    const last = parts[end]
    if (!first || !last) {
      start = -1
      return
    }
    result.push({
      key: `context:${first.part.id}`,
      type: 'context',
      refs: parts.slice(start, end + 1).map((item) => ({
        messageID: item.messageID,
        partID: item.part.id,
      })),
    })
    start = -1
  }

  parts.forEach((item, index) => {
    if (isContextGroupTool(item.part)) {
      if (start < 0) start = index
      return
    }
    flush(index - 1)
    result.push({
      key: `part:${item.messageID}:${item.part.id}`,
      type: 'part',
      ref: { messageID: item.messageID, partID: item.part.id },
    })
  })

  flush(parts.length - 1)
  return result
}

export function ContextToolGroup({
  parts,
  busy,
}: {
  parts: ToolPart[]
  busy?: boolean
}) {
  const pending =
    busy ||
    parts.some(
      (p) => p.state.status === 'pending' || p.state.status === 'running'
    )
  const summary = {
    read: parts.filter((p) => p.tool === 'read').length,
    search: parts.filter((p) => p.tool === 'glob' || p.tool === 'grep').length,
    list: parts.filter((p) => p.tool === 'list').length,
  }

  const summaryItems: string[] = []
  if (summary.read > 0)
    summaryItems.push(`${summary.read} read${summary.read > 1 ? 's' : ''}`)
  if (summary.search > 0)
    summaryItems.push(
      `${summary.search} search${summary.search > 1 ? 'es' : ''}`
    )
  if (summary.list > 0)
    summaryItems.push(`${summary.list} list${summary.list > 1 ? 's' : ''}`)

  return (
    <Collapsible className="tool-collapsible w-full" data-variant="ghost">
      <CollapsibleTrigger className="text-foreground/70 flex min-h-6 w-full items-center px-0 text-left text-[13px] leading-normal font-medium">
        <div
          data-component="context-tool-group-trigger"
          className="flex min-h-6 w-full items-center justify-start gap-0"
        >
          <span
            data-slot="context-tool-group-title"
            className="text-foreground flex min-w-0 shrink items-center gap-2 text-sm font-medium"
          >
            <span data-slot="context-tool-group-label" className="shrink-0">
              <TextShimmer
                text={pending ? 'Exploring…' : 'Explored'}
                active={pending}
              />
            </span>
            <span
              data-slot="context-tool-group-summary"
              className="text-foreground/60 min-w-0 shrink truncate text-sm font-normal"
            >
              {summaryItems.join(', ')}
            </span>
          </span>
          <CollapsibleArrow open={false} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div data-component="context-tool-group-list" className="space-y-0">
          {parts.map((part) => {
            const input = (part.state.input ?? {}) as Record<string, unknown>
            const isRunning =
              part.state.status === 'pending' || part.state.status === 'running'

            const triggerData = (() => {
              const path = typeof input.path === 'string' ? input.path : '/'
              const filePath =
                typeof input.filePath === 'string' ? input.filePath : undefined
              const pattern =
                typeof input.pattern === 'string' ? input.pattern : undefined
              const include =
                typeof input.include === 'string' ? input.include : undefined
              const offset =
                typeof input.offset === 'number' ? input.offset : undefined
              const limit =
                typeof input.limit === 'number' ? input.limit : undefined

              switch (part.tool) {
                case 'read': {
                  const args: string[] = []
                  if (offset !== undefined) args.push(`offset=${offset}`)
                  if (limit !== undefined) args.push(`limit=${limit}`)
                  return {
                    title: 'Read',
                    subtitle: filePath ? getFilename(filePath) : '',
                    args,
                  }
                }
                case 'list':
                  return { title: 'List', subtitle: getDirectory(path) || '/' }
                case 'glob':
                  return {
                    title: 'Glob',
                    subtitle: getDirectory(path) || '/',
                    args: pattern ? [`pattern=${pattern}`] : [],
                  }
                case 'grep': {
                  const args: string[] = []
                  if (pattern) args.push(`pattern=${pattern}`)
                  if (include) args.push(`include=${include}`)
                  return {
                    title: 'Grep',
                    subtitle: getDirectory(path) || '/',
                    args,
                  }
                }
                default: {
                  const info = getToolInfo(part.tool, input, {})
                  return {
                    title: info.title,
                    subtitle: info.subtitle || '',
                    args: [],
                  }
                }
              }
            })()

            return (
              <div key={part.id} data-slot="context-tool-group-item">
                <div data-component="tool-trigger">
                  <div data-slot="basic-tool-tool-trigger-content">
                    <div data-slot="basic-tool-tool-info">
                      <div data-slot="basic-tool-tool-info-structured">
                        <div
                          data-slot="basic-tool-tool-info-main"
                          className="flex min-w-0 items-center gap-0"
                        >
                          <span
                            data-slot="basic-tool-tool-title"
                            className="shrink-0 text-sm leading-normal font-medium"
                          >
                            <TextShimmer
                              text={triggerData.title}
                              active={isRunning}
                            />
                          </span>
                          {!isRunning && triggerData.subtitle && (
                            <span
                              data-slot="basic-tool-tool-subtitle"
                              className="text-foreground/60 min-w-0 shrink truncate text-sm leading-normal font-normal tabular-nums"
                            >
                              {triggerData.subtitle}
                            </span>
                          )}
                          {!isRunning &&
                            triggerData.args?.map((arg, i) => (
                              <span
                                key={i}
                                data-slot="basic-tool-tool-arg"
                                className="text-foreground/60 min-w-0 shrink truncate text-sm leading-normal font-normal tabular-nums"
                              >
                                {arg}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function extractUrls(text: string | undefined): string[] {
  if (!text) return []
  const seen = new Set<string>()
  return [...text.matchAll(/https?:\/\/[^\s<>"'`)\]]+/g)]
    .map((item) => item[0].replace(/[),.;:!?]+$/g, ''))
    .filter((item) => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}

export function ReadTool({
  part,
  defaultOpen,
}: {
  part: ToolPart
  defaultOpen?: boolean
}) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const filePath =
    typeof input.filePath === 'string' ? input.filePath : undefined
  const args: string[] = []
  if (typeof input.offset === 'number') args.push(`offset=${input.offset}`)
  if (typeof input.limit === 'number') args.push(`limit=${input.limit}`)

  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const loaded: string[] = Array.isArray(metadata.loaded)
    ? metadata.loaded.filter((p): p is string => typeof p === 'string')
    : []

  return (
    <>
      <ToolCard
        icon={<Eye className="text-muted-foreground size-3.5 shrink-0" />}
        trigger={{
          title: 'Read',
          subtitle: filePath ? getFilename(filePath) : undefined,
          args,
        }}
        status={s.status}
        defaultOpen={defaultOpen}
      />
      {loaded.length > 0 &&
        loaded.map((filepath, i) => (
          <div
            key={i}
            data-component="tool-loaded-file"
            className="text-muted-foreground flex items-center gap-2 py-1 pl-7 text-[13px]"
          >
            <span className="text-[11px]">↵</span>
            <span>Loaded {getFilename(filepath)}</span>
          </div>
        ))}
    </>
  )
}

export function ListGlobGrepTool({
  part,
  defaultOpen,
}: {
  part: ToolPart
  defaultOpen?: boolean
}) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const path = typeof input.path === 'string' ? input.path : '/'
  const output = 'output' in s ? s.output : undefined
  const isRunning = s.status === 'pending' || s.status === 'running'

  const args: string[] = []
  if (part.tool === 'glob' || part.tool === 'grep') {
    if (typeof input.pattern === 'string') args.push(`pattern=${input.pattern}`)
  }
  if (part.tool === 'grep' && typeof input.include === 'string') {
    args.push(`include=${input.include}`)
  }

  const icon =
    part.tool === 'glob' || part.tool === 'grep' ? (
      <Search className="text-muted-foreground size-3.5 shrink-0" />
    ) : (
      <FolderSearch className="text-muted-foreground size-3.5 shrink-0" />
    )

  const title =
    part.tool === 'list' ? 'List' : part.tool === 'glob' ? 'Glob' : 'Grep'

  return (
    <ToolCard
      icon={icon}
      trigger={{
        title,
        subtitle: getDirectory(path) || '/',
        args,
      }}
      status={s.status}
      defaultOpen={defaultOpen}
    >
      {output && (
        <div
          data-component="tool-output"
          data-scrollable
          className="max-h-[240px] overflow-y-auto"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
          </div>
        </div>
      )}
      {isRunning && !output && (
        <div className="text-muted-foreground flex items-center gap-2 text-[13px]">
          <Loader2 className="size-3 animate-spin" /> Running…
        </div>
      )}
    </ToolCard>
  )
}

export function WebfetchTool({ part }: { part: ToolPart }) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const url = typeof input.url === 'string' ? input.url : ''
  const pending = s.status === 'pending' || s.status === 'running'

  const trigger = (
    <div data-slot="basic-tool-tool-info-structured">
      <div
        data-slot="basic-tool-tool-info-main"
        className="flex min-w-0 items-center gap-0"
      >
        <span
          data-slot="basic-tool-tool-title"
          className="shrink-0 text-sm leading-normal font-medium"
        >
          <TextShimmer text="Web Fetch" active={pending} />
        </span>
        {!pending && url && (
          <a
            data-slot="basic-tool-tool-subtitle"
            className="clickable subagent-link text-primary min-w-0 shrink truncate text-sm leading-normal font-normal no-underline underline-offset-2"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        )}
      </div>
      {!pending && url && (
        <div data-component="tool-action" className="shrink-0">
          <ExternalLink className="text-muted-foreground size-3" />
        </div>
      )}
    </div>
  )

  return (
    <ToolCard
      icon={<Globe className="text-muted-foreground size-3.5 shrink-0" />}
      trigger={trigger}
      status={s.status}
      hideDetails
      triggerHref={!pending && url ? url : undefined}
    />
  )
}

function ExaOutput({ output }: { output?: string }) {
  const links = useMemo(() => extractUrls(output), [output])

  if (links.length === 0) return null

  return (
    <div data-component="exa-tool-output">
      <div data-slot="exa-tool-links" className="flex flex-col gap-1">
        {links.map((url, i) => (
          <a
            key={i}
            data-slot="exa-tool-link"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary truncate text-[13px] no-underline underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {url}
          </a>
        ))}
      </div>
    </div>
  )
}

export function WebsearchTool({ part }: { part: ToolPart }) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const provider = metadata.provider as string | undefined
  const query = typeof input.query === 'string' ? input.query : ''
  const title =
    provider === 'parallel'
      ? 'Parallel Web Search'
      : provider === 'exa'
        ? 'Exa Web Search'
        : 'Web Search'
  const output = 'output' in s ? s.output : undefined

  return (
    <ToolCard
      icon={<Globe className="text-muted-foreground size-3.5 shrink-0" />}
      trigger={{
        title,
        subtitle: query,
        subtitleClass: 'exa-tool-query',
      }}
      status={s.status}
    >
      <ExaOutput output={output} />
    </ToolCard>
  )
}

const agentTones: Record<string, string> = {
  ask: 'text-blue-500',
  build: 'text-amber-500',
  docs: 'text-emerald-500',
  plan: 'text-violet-500',
}

const agentPalette = [
  'text-blue-500',
  'text-amber-500',
  'text-emerald-500',
  'text-violet-500',
  'text-sky-500',
  'text-green-500',
  'text-yellow-500',
  'text-purple-500',
  'text-orange-500',
  'text-rose-500',
  'text-teal-500',
  'text-red-500',
]

function tone(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return agentPalette[hash % agentPalette.length]
}

function taskAgent(raw: unknown): { name?: string; colorClass?: string } {
  if (typeof raw !== 'string' || !raw) return {}
  const key = raw.toLowerCase()
  return {
    name: `${raw[0]!.toUpperCase()}${raw.slice(1)}`,
    colorClass: agentTones[key] ?? tone(key),
  }
}

export function TaskTool({ part }: { part: ToolPart }) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const agent = taskAgent(input.subagent_type)
  const title = agent.name ?? 'Agent'
  const isRunning = s.status === 'pending' || s.status === 'running'
  const childSessionId =
    typeof metadata.sessionId === 'string' && metadata.sessionId
      ? metadata.sessionId
      : undefined

  const subtitle = (() => {
    const desc =
      typeof input.description === 'string' && input.description
        ? input.description
        : undefined
    const value = desc || childSessionId
    if (!value) return undefined
    if (metadata.background === true) return `${value} (background)`
    return value
  })()

  const trigger = (
    <div data-component="task-tool-card">
      <div data-slot="basic-tool-tool-info-structured">
        <div
          data-slot="basic-tool-tool-info-main"
          className="flex min-w-0 items-center gap-0"
        >
          {isRunning && (
            <span
              data-component="task-tool-spinner"
              className={cn('mr-1', agent.colorClass ?? 'text-primary')}
            >
              <Loader2 className="size-4 animate-spin" />
            </span>
          )}
          <span
            data-component="task-tool-title"
            className={cn(
              'shrink-0 text-sm leading-normal font-medium',
              agent.colorClass ?? 'text-foreground'
            )}
          >
            {title}
          </span>
          {subtitle && (
            <span
              data-slot="basic-tool-tool-subtitle"
              className="text-foreground/60 min-w-0 shrink truncate text-sm leading-normal font-normal tabular-nums"
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {childSessionId && (
        <div data-component="task-tool-action" className="shrink-0">
          <ExternalLink className="text-muted-foreground size-3" />
        </div>
      )}
    </div>
  )

  return (
    <ToolCard
      icon={null}
      trigger={trigger}
      status={s.status}
      hideDetails
      clickable={!!childSessionId}
    />
  )
}

export function BashTool({
  part,
  defaultOpen,
}: {
  part: ToolPart
  defaultOpen?: boolean
}) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const cmd = (input.command ?? metadata.command ?? '') as string
  const output = 'output' in s ? s.output : undefined
  const metadataOutput =
    typeof metadata.output === 'string' ? metadata.output : ''
  const isRunning = s.status === 'pending' || s.status === 'running'
  const pending = isRunning

  const text = useMemo(() => {
    const out = (output || metadataOutput || '').replace(/\r\n?/g, '\n')
    return `$ ${cmd}${out ? '\n\n' + out : ''}`
  }, [cmd, output, metadataOutput])

  const { copied, handleCopy } = useCopy(text)

  const trigger = (
    <div data-slot="basic-tool-tool-info-structured">
      <div
        data-slot="basic-tool-tool-info-main"
        className="flex min-w-0 items-center gap-0"
      >
        <span
          data-slot="basic-tool-tool-title"
          className="shrink-0 text-sm leading-normal font-medium"
        >
          <TextShimmer text="Shell" active={pending} />
        </span>
        {!pending &&
          typeof input.description === 'string' &&
          input.description && (
            <span
              data-slot="basic-tool-tool-subtitle"
              className="text-foreground/60 min-w-0 shrink truncate text-sm leading-normal font-normal tabular-nums"
            >
              {input.description}
            </span>
          )}
      </div>
    </div>
  )

  return (
    <ToolCard
      icon={<Terminal className="text-muted-foreground size-3.5 shrink-0" />}
      trigger={trigger}
      status={s.status}
      defaultOpen={defaultOpen}
    >
      <div
        data-component="bash-output"
        className="relative w-full overflow-hidden rounded-md border"
      >
        <div
          data-slot="bash-copy"
          className="group-hover:bash:opacity-100 absolute top-1 right-1 z-10 opacity-0 transition-opacity"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={handleCopy}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  {copied ? (
                    <Check className="size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={4}>
                {copied ? 'Copied' : 'Copy'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div
          data-slot="bash-scroll"
          data-scrollable
          className="max-h-[240px] w-full overflow-x-hidden overflow-y-auto"
        >
          <pre data-slot="bash-pre" className="m-0 p-3">
            <code className="font-mono text-[13px] leading-normal [overflow-wrap:anywhere] whitespace-pre-wrap">
              {text}
            </code>
          </pre>
        </div>
      </div>
    </ToolCard>
  )
}

export function EditWriteTool({
  part,
  defaultOpen,
}: {
  part: ToolPart
  defaultOpen?: boolean
}) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const isEdit = part.tool === 'edit'
  const pending = s.status === 'pending' || s.status === 'running'

  const filediffObj =
    typeof metadata.filediff === 'object' && metadata.filediff !== null
      ? (metadata.filediff as Record<string, unknown>)
      : undefined
  const filePath =
    (typeof filediffObj?.file === 'string' ? filediffObj.file : undefined) ??
    (typeof input.filePath === 'string' ? input.filePath : undefined) ??
    ''
  const filename = getFilename(filePath)
  const directory = getDirectory(filePath)

  const filediff = metadata.filediff as
    | {
        additions?: number
        deletions?: number
        patch?: string
        before?: string
        after?: string
        file?: string
      }
    | undefined

  const diagnostics = getDiagnostics(
    metadata.diagnostics as Record<string, Diagnostic[]> | undefined,
    typeof input.filePath === 'string' ? input.filePath : undefined
  )

  const trigger = (
    <div
      data-component={isEdit ? 'edit-trigger' : 'write-trigger'}
      className="flex w-full items-center justify-between gap-3"
    >
      <div
        data-slot="message-part-title-area"
        className="flex min-w-0 items-center gap-0"
      >
        <div
          data-slot="message-part-title"
          className="flex min-w-0 items-center gap-0"
        >
          <span
            data-slot="message-part-title-text"
            className="shrink-0 text-sm leading-normal font-medium"
          >
            <TextShimmer text={isEdit ? 'Edit' : 'Write'} active={pending} />
          </span>
          {!pending && filename && (
            <span
              data-slot="message-part-title-filename"
              className="text-foreground/80 font-mono text-sm"
            >
              {filename}
            </span>
          )}
        </div>
        {!pending && directory && (
          <div data-slot="message-part-path">
            <span
              data-slot="message-part-directory"
              className="text-muted-foreground truncate text-[13px]"
            >
              {directory}/
            </span>
          </div>
        )}
      </div>
      <div data-slot="message-part-actions">
        {!pending && filediff && (
          <DiffChanges
            additions={filediff.additions}
            deletions={filediff.deletions}
          />
        )}
      </div>
    </div>
  )

  return (
    <div data-component={isEdit ? 'edit-tool' : 'write-tool'}>
      <ToolCard
        icon={<FileCode className="text-muted-foreground size-3.5 shrink-0" />}
        trigger={trigger}
        status={s.status}
        defaultOpen={defaultOpen}
      >
        {filePath && (
          <ToolFileAccordion
            path={filePath}
            actions={
              !pending && filediff ? (
                <DiffChanges
                  additions={filediff.additions}
                  deletions={filediff.deletions}
                />
              ) : undefined
            }
          >
            <div data-component={isEdit ? 'edit-content' : 'write-content'}>
              {isEdit &&
              filediff &&
              filediff.before !== undefined &&
              filediff.after !== undefined ? (
                <div className="space-y-2">
                  <div className="bg-background rounded-md border p-2">
                    <div className="text-muted-foreground mb-1 text-[11px] font-medium">
                      Before
                    </div>
                    <pre className="max-h-[200px] overflow-auto font-mono text-[13px] whitespace-pre-wrap">
                      {filediff.before}
                    </pre>
                  </div>
                  <div className="bg-background rounded-md border p-2">
                    <div className="text-muted-foreground mb-1 text-[11px] font-medium">
                      After
                    </div>
                    <pre className="max-h-[200px] overflow-auto font-mono text-[13px] whitespace-pre-wrap">
                      {filediff.after}
                    </pre>
                  </div>
                </div>
              ) : !isEdit && typeof input.content === 'string' ? (
                <pre className="max-h-[300px] overflow-auto p-3 font-mono text-[13px] whitespace-pre-wrap">
                  {input.content}
                </pre>
              ) : null}
            </div>
          </ToolFileAccordion>
        )}
        <DiagnosticsDisplay diagnostics={diagnostics} />
      </ToolCard>
    </div>
  )
}

export function ApplyPatchTool({
  part,
  defaultOpen,
}: {
  part: ToolPart
  defaultOpen?: boolean
}) {
  const s = part.state
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const isError = s.status === 'error'
  const error = 'error' in s ? s.error : undefined

  const files = useMemo(() => {
    const raw = metadata.files
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (
        f
      ): f is Record<string, unknown> & {
        file?: string
        type?: string
        additions?: number
        deletions?: number
      } => typeof f === 'object' && f !== null
    )
  }, [metadata.files])

  const fileCount = files.length
  const subtitle =
    fileCount > 0 ? `${fileCount} file${fileCount > 1 ? 's' : ''}` : undefined

  const [expanded, setExpanded] = useState<string[]>(() =>
    files.filter((f) => f.type !== 'delete').map((f) => String(f.file ?? ''))
  )

  if (isError && error) {
    return (
      <div data-component="apply-patch-tool">
        <ToolCard
          icon={
            <FileCode className="text-muted-foreground size-3.5 shrink-0" />
          }
          trigger={{ title: 'Patch', subtitle }}
          status={s.status}
          defaultOpen={defaultOpen}
        >
          <div className="bg-destructive/10 text-destructive rounded p-2 text-xs">
            {String(error)}
          </div>
        </ToolCard>
      </div>
    )
  }

  return (
    <div data-component="apply-patch-tool">
      <ToolCard
        icon={<FileCode className="text-muted-foreground size-3.5 shrink-0" />}
        trigger={{ title: 'Patch', subtitle }}
        status={s.status}
        defaultOpen={defaultOpen}
      >
        {files.length > 0 && (
          <Accordion
            type="multiple"
            value={expanded}
            onValueChange={(v) =>
              setExpanded(Array.isArray(v) ? v : v ? [v] : [])
            }
            data-scope="apply-patch"
          >
            {files.map((file, i) => {
              const filePath = String(file.file ?? `file-${i}`)
              const changeType = file.type as string | undefined
              return (
                <AccordionItem
                  key={filePath}
                  value={filePath}
                  data-type={changeType}
                >
                  <AccordionTrigger className="py-1.5 hover:no-underline">
                    <div
                      data-slot="apply-patch-trigger-content"
                      className="flex min-w-0 flex-1 items-center justify-between gap-2"
                    >
                      <div
                        data-slot="apply-patch-file-info"
                        className="flex min-w-0 items-center gap-2"
                      >
                        <FileCode className="text-muted-foreground size-3.5 shrink-0" />
                        <div
                          data-slot="apply-patch-file-name-container"
                          className="min-w-0"
                        >
                          {filePath.includes('/') && (
                            <span
                              data-slot="apply-patch-directory"
                              className="text-muted-foreground text-xs"
                            >
                              {`\u202A${getDirectory(filePath)}\u202C`}
                            </span>
                          )}
                          <span
                            data-slot="apply-patch-filename"
                            className="text-sm font-medium"
                          >
                            {getFilename(filePath)}
                          </span>
                        </div>
                      </div>
                      <div
                        data-slot="apply-patch-trigger-actions"
                        className="flex shrink-0 items-center gap-1.5"
                      >
                        {changeType === 'add' && (
                          <span
                            data-slot="apply-patch-change"
                            data-type="added"
                            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                          >
                            Created
                          </span>
                        )}
                        {changeType === 'delete' && (
                          <span
                            data-slot="apply-patch-change"
                            data-type="removed"
                            className="text-[11px] font-medium text-red-600 dark:text-red-400"
                          >
                            Deleted
                          </span>
                        )}
                        {changeType === 'move' && (
                          <span
                            data-slot="apply-patch-change"
                            data-type="modified"
                            className="text-[11px] font-medium text-amber-600 dark:text-amber-400"
                          >
                            Moved
                          </span>
                        )}
                        {changeType !== 'add' &&
                          changeType !== 'delete' &&
                          changeType !== 'move' && (
                            <DiffChanges
                              additions={file.additions}
                              deletions={file.deletions}
                            />
                          )}
                        <ChevronDown className="text-muted-foreground size-3" />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div data-component="apply-patch-file-diff">
                      <pre className="max-h-[200px] overflow-auto p-2 font-mono text-[13px] whitespace-pre-wrap">
                        {typeof file.patch === 'string'
                          ? file.patch
                          : 'No diff content available'}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </ToolCard>
    </div>
  )
}

export function TodowriteTool({ part }: { part: ToolPart }) {
  const s = part.state
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}
  const input = (s.input ?? {}) as Record<string, unknown>

  const todos: Todo[] = useMemo(() => {
    const metaTodos = metadata.todos
    if (Array.isArray(metaTodos)) return metaTodos
    const inputTodos = input.todos
    if (Array.isArray(inputTodos)) return inputTodos
    return []
  }, [metadata.todos, input.todos])

  const completedCount = todos.filter((t) => t.status === 'completed').length
  const subtitle =
    todos.length > 0 ? `${completedCount}/${todos.length}` : undefined

  return (
    <ToolCard
      icon={<Check className="text-muted-foreground size-3.5 shrink-0" />}
      trigger={{ title: 'To-dos', subtitle }}
      status={s.status}
      defaultOpen
    >
      {todos.length > 0 && (
        <div data-component="todos" className="flex flex-col gap-2 py-2.5 pb-6">
          {todos.map((todo, i) => (
            <div key={i} className="flex items-start gap-2">
              <Checkbox
                checked={todo.status === 'completed'}
                disabled
                className="mt-0.5"
              />
              <span
                data-slot="message-part-todo-content"
                data-completed={
                  todo.status === 'completed' ? 'completed' : undefined
                }
                className={cn(
                  'text-[13px] leading-tight',
                  todo.status === 'completed' &&
                    'text-muted-foreground/50 line-through'
                )}
              >
                {todo.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </ToolCard>
  )
}

export function QuestionTool({ part }: { part: ToolPart }) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const metadata =
    'metadata' in s
      ? ((s as Record<string, unknown>).metadata as Record<string, unknown>)
      : {}

  const questions = ((input.questions ?? []) as QuestionInfo[]).filter(Boolean)
  const answers = ((metadata.answers ?? []) as QuestionAnswer[][]).filter(
    Boolean
  )
  const completed = answers.length > 0
  const isError = s.status === 'error'
  const error = 'error' in s ? s.error : undefined

  const subtitle = (() => {
    const count = questions.length
    if (count === 0) return ''
    if (completed) return `${count} answered`
    return `${count} question${count > 1 ? 's' : ''}`
  })()

  if (isError && error && String(error).includes('dismissed')) {
    return (
      <div className="flex w-full justify-end py-1">
        <span className="text-muted-foreground cursor-default text-[13px]">
          Dismissed
        </span>
      </div>
    )
  }

  return (
    <ToolCard
      icon={
        <span className="flex size-3.5 items-center justify-center text-[11px] font-bold">
          ?
        </span>
      }
      trigger={{ title: 'Questions', subtitle }}
      status={s.status}
      defaultOpen={completed}
    >
      {completed && (
        <div
          data-component="question-answers"
          className="flex flex-col gap-3 py-2"
        >
          {questions.map((q, i) => {
            const answer = answers[i] ?? []
            return (
              <div
                key={i}
                data-slot="question-answer-item"
                className="flex flex-col gap-0.5 text-[13px]"
              >
                <div
                  data-slot="question-text"
                  className="text-muted-foreground"
                >
                  {q.question}
                </div>
                <div data-slot="answer-text" className="text-foreground">
                  {answer.join(', ') || 'No answer'}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ToolCard>
  )
}

export function SkillTool({ part }: { part: ToolPart }) {
  const s = part.state
  const input = (s.input ?? {}) as Record<string, unknown>
  const name = (
    typeof input.name === 'string' && input.name ? input.name : 'Skill'
  ) as string
  const isRunning = s.status === 'pending' || s.status === 'running'

  const trigger = (
    <div data-slot="basic-tool-tool-info-structured">
      <div
        data-slot="basic-tool-tool-info-main"
        className="flex min-w-0 items-center gap-0"
      >
        <span
          data-slot="basic-tool-tool-title"
          className="shrink-0 text-sm leading-normal font-medium capitalize"
        >
          <TextShimmer text={name} active={isRunning} />
        </span>
      </div>
    </div>
  )

  return (
    <ToolCard icon={null} trigger={trigger} status={s.status} hideDetails />
  )
}

export function ToolPartDisplay({
  part,
  defaultOpen,
}: {
  part: ToolPart
  defaultOpen?: boolean
}) {
  switch (part.tool) {
    case 'read':
      return <ReadTool part={part} defaultOpen={defaultOpen} />
    case 'list':
    case 'glob':
    case 'grep':
      return <ListGlobGrepTool part={part} defaultOpen={defaultOpen} />
    case 'webfetch':
      return <WebfetchTool part={part} />
    case 'websearch':
      return <WebsearchTool part={part} />
    case 'task':
      return <TaskTool part={part} />
    case 'bash':
      return <BashTool part={part} defaultOpen={defaultOpen} />
    case 'edit':
    case 'write':
      return <EditWriteTool part={part} defaultOpen={defaultOpen} />
    case 'apply_patch':
      return <ApplyPatchTool part={part} defaultOpen={defaultOpen} />
    case 'todowrite':
      return <TodowriteTool part={part} />
    case 'question':
      return <QuestionTool part={part} />
    case 'skill':
      return <SkillTool part={part} />
    default:
      return (
        <GenericTool
          tool={part.tool}
          status={part.state.status}
          hideDetails={defaultOpen === undefined}
          input={part.state.input as Record<string, unknown>}
        />
      )
  }
}

function ContextGroupPart({
  parts,
  busy,
}: {
  parts: ToolPart[]
  busy?: boolean
}) {
  return <ContextToolGroup parts={parts} busy={busy} />
}

function PartGroupRenderer({
  group,
  partMap,
  messageMap,
  isWorking,
  isLastGroup,
  turnDurationMs,
}: {
  group: PartGroup
  partMap: Map<string, Part>
  messageMap: Map<string, Message>
  isWorking: boolean
  isLastGroup: boolean
  turnDurationMs?: number
}) {
  if (group.type === 'context') {
    const parts = group.refs
      .map((ref) => partMap.get(ref.partID))
      .filter((p): p is ToolPart => !!p && isContextGroupTool(p))
    if (parts.length === 0) return null
    const busy = isWorking && isLastGroup
    return <ContextGroupPart parts={parts} busy={busy} />
  }

  const part = partMap.get(group.ref.partID)
  const message = messageMap.get(group.ref.messageID)
  if (!part || !message) return null

  return (
    <MessagePart
      part={part}
      message={message}
      turnDurationMs={turnDurationMs}
    />
  )
}

function MessagePart({
  part,
  message,
  turnDurationMs,
}: {
  part: Part
  message: Message
  turnDurationMs?: number
}) {
  switch (part.type) {
    case 'text':
      return (
        <TextPartDisplay
          part={part}
          message={message}
          turnDurationMs={turnDurationMs}
        />
      )
    case 'reasoning':
      return <ReasoningPartDisplay part={part} message={message} />
    case 'tool':
      return (
        <ToolPartDisplay part={part} defaultOpen={toolDefaultOpen(part.tool)} />
      )
    case 'file':
      return <FilePartDisplay part={part} />
    case 'compaction':
      return <MessageDivider label="Context compacted" />
    case 'retry':
      return (
        <div className="text-destructive/80 text-xs">
          Retry #{part.attempt} failed: {part.error?.data?.message || 'error'}
        </div>
      )
    default:
      return null
  }
}

export function TextPartDisplay({
  part,
  message,
  turnDurationMs,
}: {
  part: TextPart
  message: Message
  turnDurationMs?: number
}) {
  const isAssistant = message.role === 'assistant'
  const assistantMsg = message as AssistantMessage
  const interrupted =
    isAssistant && assistantMsg.error?.name === 'MessageAbortedError'

  const { copied, handleCopy } = useCopy(part.text)

  const meta = useMemo(() => {
    if (!isAssistant) return ''
    const items: string[] = []
    const agent = assistantMsg.agent
    if (agent) items.push(agent[0]!.toUpperCase() + agent.slice(1))
    const modelID = assistantMsg.modelID
    if (modelID) items.push(modelID)
    const completed = assistantMsg.time?.completed
    const created = assistantMsg.time?.created
    if (turnDurationMs !== undefined && turnDurationMs >= 0) {
      items.push(formatDuration(turnDurationMs))
    } else if (typeof completed === 'number' && typeof created === 'number') {
      const ms = (completed - created) * 1000
      if (ms >= 0) items.push(formatDuration(ms))
    }
    if (interrupted) items.push('Interrupted')
    return items.filter((x) => !!x).join(' \u00B7 ')
  }, [isAssistant, assistantMsg, interrupted, turnDurationMs])

  return (
    <div data-component="text-part" className="mt-6 w-full">
      <div data-slot="text-part-body">
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
        </div>
      </div>
      <div
        data-slot="text-part-copy-wrapper"
        data-interrupted={interrupted ? '' : undefined}
        className="group/copy flex items-center gap-2 pt-0.5"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                onClick={handleCopy}
                onMouseDown={(e) => e.preventDefault()}
              >
                {copied ? (
                  <Check className="size-3" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              {copied ? 'Copied' : 'Copy response'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {meta && (
          <span
            data-slot="text-part-meta"
            className="text-muted-foreground text-[12px] select-none"
          >
            {meta}
          </span>
        )}
      </div>
    </div>
  )
}

export function ReasoningPartDisplay({
  part,
}: {
  part: ReasoningPart
  message: Message
}) {
  return (
    <div data-component="reasoning-part" className="text-foreground/60 w-full">
      <div className="prose prose-sm dark:prose-invert text-muted-foreground mt-4 max-w-none text-[13px] italic">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
      </div>
    </div>
  )
}

export function FilePartDisplay({ part }: { part: FilePart }) {
  const isImage = part.mime?.startsWith('image/')
  const [showPreview, setShowPreview] = useState(false)
  const name = part.filename || 'file'

  if (isImage) {
    return (
      <>
        <div
          className="cursor-pointer overflow-hidden rounded-md border"
          onClick={() => setShowPreview(true)}
        >
          <img
            src={part.url}
            alt={name}
            className="max-h-[300px] w-auto object-contain"
          />
        </div>
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-h-[90vh] max-w-[90vw] border-0 bg-black/90 p-0">
            <img
              src={part.url}
              alt={name}
              className="max-h-[85vh] max-w-[85vw] object-contain"
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <div className="bg-muted/20 text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs">
      <File className="size-3.5" />
      <span>{name}</span>
    </div>
  )
}

export function UserMessageDisplay({
  message,
  parts,
}: {
  message: UserMessage
  parts: Part[]
}) {
  const textPart = parts.find(
    (p) => p.type === 'text' && !(p as TextPart).synthetic
  ) as TextPart | undefined
  const text = textPart?.text || ''
  const files = parts.filter((p) => p.type === 'file') as FilePart[]
  const attachments = files.filter((f) => f.url?.startsWith('data:'))
  const agentParts = parts.filter((p) => p.type === 'agent') as Array<{
    type: 'agent'
    source?: { start: number; end: number }
  }>

  const created = message.time?.created
  const timeStr = created
    ? new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(created)
    : ''
  const agent = message.agent
  const modelID = message.model?.modelID
  const metaHead = [
    agent ? agent[0]!.toUpperCase() + agent.slice(1) : '',
    modelID || '',
  ]
    .filter((x) => !!x)
    .join('\u00A0\u00B7\u00A0')

  const { copied, handleCopy } = useCopy(text)

  const segments = useMemo(() => {
    const allRefs: { start: number; end: number; type: 'file' | 'agent' }[] = [
      ...files
        .filter(
          (r) =>
            (
              r as unknown as {
                source?: { text?: { start: number; end: number } }
              }
            ).source?.text?.start !== undefined &&
            (
              r as unknown as {
                source?: { text?: { start: number; end: number } }
              }
            ).source?.text?.end !== undefined
        )
        .map((r) => ({
          start: (
            r as unknown as { source: { text: { start: number; end: number } } }
          ).source.text.start,
          end: (
            r as unknown as { source: { text: { start: number; end: number } } }
          ).source.text.end,
          type: 'file' as const,
        })),
      ...agentParts
        .filter(
          (a) => a.source?.start !== undefined && a.source?.end !== undefined
        )
        .map((a) => ({
          start: a.source!.start,
          end: a.source!.end,
          type: 'agent' as const,
        })),
    ].sort((a, b) => a.start - b.start)

    const result: { text: string; type?: 'file' | 'agent' }[] = []
    let lastIndex = 0

    for (const ref of allRefs) {
      if (ref.start < lastIndex) continue
      if (ref.start > lastIndex) {
        result.push({ text: text.slice(lastIndex, ref.start) })
      }
      result.push({ text: text.slice(ref.start, ref.end), type: ref.type })
      lastIndex = ref.end
    }
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex) })
    }
    return result
  }, [text, files, agentParts])

  return (
    <div
      data-component="user-message"
      className="flex w-full flex-col items-end gap-0 self-stretch"
    >
      {attachments.length > 0 && (
        <div
          data-slot="user-message-attachments"
          className="mb-2 flex flex-wrap justify-end gap-2"
        >
          {attachments.map((file, i) => {
            const name = file.filename || 'attachment'
            const isImage = file.mime?.startsWith('image/')
            if (isImage) {
              return <UserImageAttachment key={i} url={file.url} name={name} />
            }
            return (
              <div
                key={i}
                data-slot="user-message-attachment"
                data-type="file"
                title={name}
                className="bg-muted/30 flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
              >
                <File className="text-muted-foreground size-3" />
                <span className="text-foreground truncate">{name}</span>
              </div>
            )
          })}
        </div>
      )}
      {text && (
        <>
          <div
            data-slot="user-message-body"
            className="max-w-min(82%,64ch) ml-auto flex w-fit flex-col items-end"
          >
            <div
              data-slot="user-message-text"
              className="border-border bg-muted/5 inline-block max-w-full overflow-hidden rounded-md border px-3 py-2 text-sm break-words whitespace-pre-wrap"
            >
              {segments.map((segment, i) => (
                <span key={i} data-highlight={segment.type}>
                  {segment.text}
                </span>
              ))}
            </div>
          </div>
          <div
            data-slot="user-message-copy-wrapper"
            className="flex items-center gap-1"
          >
            {(metaHead || timeStr) && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-[12px]">
                {metaHead && (
                  <span
                    data-slot="user-message-meta"
                    className="text-muted-foreground text-[12px] select-none"
                  >
                    {metaHead}
                  </span>
                )}
                {metaHead && timeStr && (
                  <span
                    data-slot="user-message-meta-sep"
                    className="text-muted-foreground text-[12px] select-none"
                  >
                    {'\u00A0\u00B7\u00A0'}
                  </span>
                )}
                {timeStr && (
                  <span
                    data-slot="user-message-meta-tail"
                    className="text-muted-foreground text-[12px] select-none"
                  >
                    {timeStr}
                  </span>
                )}
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-5 w-5 p-0"
                    onClick={handleCopy}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {copied ? (
                      <Check className="size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={4}>
                  {copied ? 'Copied' : 'Copy message'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </>
      )}
    </div>
  )
}

function UserImageAttachment({ url, name }: { url: string; name: string }) {
  const [showPreview, setShowPreview] = useState(false)
  return (
    <>
      <div
        data-slot="user-message-attachment"
        data-type="image"
        data-clickable="true"
        className="cursor-pointer overflow-hidden rounded-md border"
        onClick={() => setShowPreview(true)}
      >
        <img
          src={url}
          alt={name}
          className="max-h-[200px] w-auto object-contain"
        />
      </div>
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-[90vh] max-w-[90vw] border-0 bg-black/90 p-0">
          <img
            src={url}
            alt={name}
            className="max-h-[85vh] max-w-[85vw] object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AssistantMessageDisplay({
  message,
  parts,
  isWorking,
  turnDurationMs,
}: {
  message: AssistantMessage
  parts: Part[]
  isWorking?: boolean
  turnDurationMs?: number
}) {
  const partMap = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts])
  const messageMap = useMemo(
    () => new Map([[message.id, message as Message]]),
    [message]
  )

  const groups = useMemo(
    () =>
      groupParts(
        parts
          .filter((p) => renderable(p, true))
          .map((p) => ({ messageID: message.id, part: p }))
      ),
    [parts, message.id]
  )

  const lastGroupKey = groups.at(-1)?.key

  return (
    <div
      data-slot="session-turn-assistant-content"
      className="flex w-full min-w-0 flex-col gap-3"
    >
      {groups.map((group) => (
        <PartGroupRenderer
          key={group.key}
          group={group}
          partMap={partMap}
          messageMap={messageMap}
          isWorking={!!isWorking}
          isLastGroup={group.key === lastGroupKey}
          turnDurationMs={turnDurationMs}
        />
      ))}
    </div>
  )
}

interface MessageItemProps {
  msg: { info: Message; parts: Part[] }
}

export function MessageItem({ msg }: MessageItemProps) {
  const role = msg.info.role

  if (role === 'user') {
    return (
      <div
        data-slot="session-turn-message-container"
        className="overflow-anchor-none flex w-full flex-col items-start gap-0 self-stretch px-4 md:px-5"
      >
        <div data-slot="session-turn-message-content" aria-live="off">
          <UserMessageDisplay
            message={msg.info as UserMessage}
            parts={msg.parts}
          />
        </div>
      </div>
    )
  }

  if (role === 'assistant') {
    const assistantMsg = msg.info as AssistantMessage
    const interrupted = assistantMsg.error?.name === 'MessageAbortedError'
    const streaming = typeof assistantMsg.time?.completed !== 'number'
    const completed = assistantMsg.time?.completed
    const created = assistantMsg.time?.created
    const turnDurationMs =
      typeof completed === 'number' && typeof created === 'number'
        ? (completed - created) * 1000
        : undefined

    return (
      <div
        data-slot="session-turn-message-container"
        className="overflow-anchor-none flex w-full flex-col items-start gap-0 self-stretch px-4 md:px-5"
      >
        <div
          data-slot="session-turn-assistant-content"
          aria-hidden={streaming && !interrupted}
        >
          <AssistantMessageDisplay
            message={assistantMsg}
            parts={msg.parts}
            isWorking={streaming && !interrupted}
            turnDurationMs={turnDurationMs}
          />
        </div>
      </div>
    )
  }

  return null
}

export type TimelineRow =
  | { _tag: 'UserMessage'; userMessageID: string; previousUserMessage: boolean }
  | {
      _tag: 'TurnDivider'
      userMessageID: string
      label: 'compaction' | 'interrupted'
    }
  | {
      _tag: 'AssistantPart'
      userMessageID: string
      group: PartGroup
      previousAssistantPart: boolean
      messageID: string
    }
  | { _tag: 'Thinking'; userMessageID: string; reasoningHeading?: string }
  | { _tag: 'Error'; userMessageID: string; text: string }
  | { _tag: 'BottomSpacer' }

export function timelineRowKey(row: TimelineRow): string {
  switch (row._tag) {
    case 'UserMessage':
      return `user-message:${row.userMessageID}`
    case 'TurnDivider':
      return `turn-divider:${row.userMessageID}:${row.label}`
    case 'AssistantPart':
      return `assistant-part:${row.userMessageID}:${row.group.key}`
    case 'Thinking':
      return `thinking:${row.userMessageID}`
    case 'Error':
      return `error:${row.userMessageID}`
    case 'BottomSpacer':
      return 'bottom-spacer'
  }
}

export function constructTimelineRows(
  messages: { info: Message; parts: Part[] }[],
  isProcessing: boolean
): TimelineRow[] {
  const rows: TimelineRow[] = []

  const assistantMessagesByParent = new Map<string, AssistantMessage[]>()
  const partsByMessage = new Map<string, Part[]>()

  for (const msg of messages) {
    partsByMessage.set(msg.info.id, msg.parts)
    if (msg.info.role === 'assistant') {
      const aMsg = msg.info as AssistantMessage
      const parentID = aMsg.parentID
      if (!parentID) continue
      const list = assistantMessagesByParent.get(parentID)
      if (list) {
        list.push(aMsg)
      } else {
        assistantMessagesByParent.set(parentID, [aMsg])
      }
    }
  }

  function getMsgParts(id: string) {
    return partsByMessage.get(id) ?? []
  }

  const userMessages = messages.filter((m) => m.info.role === 'user')
  const lastUserMessage = userMessages[userMessages.length - 1]
  function isActiveUserMsg(id: string) {
    return isProcessing && lastUserMessage?.info.id === id
  }

  for (let userIndex = 0; userIndex < userMessages.length; userIndex++) {
    const userMsg = userMessages[userIndex]
    const userMessageID = userMsg.info.id
    const previousUserMessage = userIndex > 0

    const userParts = getMsgParts(userMessageID)
    const hasCompaction = userParts.some((p) => p.type === 'compaction')

    const assistants = assistantMessagesByParent.get(userMessageID) ?? []
    const interruptedIndex = assistants.findIndex(
      (m) => m.error?.name === 'MessageAbortedError'
    )
    const interrupted = interruptedIndex !== -1
    const errorAssistant = assistants.find(
      (m) => m.error && m.error.name !== 'MessageAbortedError'
    )

    const isActive = isActiveUserMsg(userMessageID)

    rows.push({
      _tag: 'UserMessage',
      userMessageID,
      previousUserMessage,
    })

    if (hasCompaction) {
      rows.push({
        _tag: 'TurnDivider',
        userMessageID,
        label: 'compaction',
      })
    }

    const assistantPartRefs = assistants.flatMap((message, messageIndex) =>
      getMsgParts(message.id)
        .filter((part) => renderable(part, true))
        .map((part) => ({ messageID: message.id, messageIndex, part }))
    )

    let assistantItems: Array<
      { type: 'part'; group: PartGroup } | { type: 'interrupted' }
    >

    if (interrupted && !hasCompaction) {
      const beforeInterrupt = groupParts(
        assistantPartRefs.filter((ref) => ref.messageIndex <= interruptedIndex)
      )
      const afterInterrupt = groupParts(
        assistantPartRefs.filter((ref) => ref.messageIndex > interruptedIndex)
      )
      assistantItems = [
        ...beforeInterrupt.map((group) => ({ type: 'part' as const, group })),
        { type: 'interrupted' as const },
        ...afterInterrupt.map((group) => ({ type: 'part' as const, group })),
      ]
    } else {
      assistantItems = groupParts(assistantPartRefs).map((group) => ({
        type: 'part' as const,
        group,
      }))
    }

    let assistantGroupIndex = 0
    for (const item of assistantItems) {
      if (item.type === 'interrupted') {
        rows.push({
          _tag: 'TurnDivider',
          userMessageID,
          label: 'interrupted',
        })
        continue
      }

      rows.push({
        _tag: 'AssistantPart',
        userMessageID,
        group: item.group,
        previousAssistantPart: assistantGroupIndex > 0,
        messageID: item.group.type === 'part' ? item.group.ref.messageID : '',
      })
      assistantGroupIndex += 1
    }

    if (
      isActive &&
      isProcessing &&
      !errorAssistant &&
      assistantPartRefs.length === 0
    ) {
      const heading = assistants
        .flatMap((message) => getMsgParts(message.id))
        .map((part) =>
          part.type === 'reasoning' && part.text
            ? reasoningHeading(part.text)
            : undefined
        )
        .find((value): value is string => !!value)

      rows.push({
        _tag: 'Thinking',
        userMessageID,
        reasoningHeading: heading,
      })
    }

    if (errorAssistant) {
      const data = errorAssistant.error?.data?.message
      const text =
        typeof data === 'string'
          ? data
          : data === undefined || data === null
            ? ''
            : String(data)
      rows.push({
        _tag: 'Error',
        userMessageID,
        text: unwrapErrorMessage(text),
      })
    }
  }

  rows.push({ _tag: 'BottomSpacer' })

  return rows
}

function reasoningHeading(text: string) {
  const markdown = text.replace(/\r\n?/g, '\n')
  const html = markdown.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)
  if (html?.[1]) {
    const value = cleanHeading(html[1].replace(/<[^>]+>/g, ' '))
    if (value) return value
  }
  const atx = markdown.match(/^\s{0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$/m)
  if (atx?.[1]) {
    const value = cleanHeading(atx[1])
    if (value) return value
  }
  const setext = markdown.match(/^([^\n]+)\n(?:=+|-+)\s*$/m)
  if (setext?.[1]) {
    const value = cleanHeading(setext[1])
    if (value) return value
  }
  const strong = markdown.match(/^\s*(?:\*\*|__)(.+?)(?:\*\*|__)\s*$/m)
  if (strong?.[1]) {
    const value = cleanHeading(strong[1])
    if (value) return value
  }
  return undefined
}

function cleanHeading(value: string) {
  return value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~]+/g, '')
    .trim()
}

function unwrapErrorMessage(message: string) {
  const text = message.replace(/^Error:\s*/, '').trim()

  function parse(value: string) {
    try {
      return JSON.parse(value) as unknown
    } catch {
      return undefined
    }
  }

  function read(value: string) {
    const first = parse(value)
    if (typeof first !== 'string') return first
    return parse(first.trim())
  }

  let json = read(text)

  if (json === undefined) {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end > start) json = read(text.slice(start, end + 1))
  }

  if (!isRecord(json)) return message

  const err = isRecord(json.error) ? json.error : undefined
  if (err) {
    const type = typeof err.type === 'string' ? err.type : undefined
    const msg = typeof err.message === 'string' ? err.message : undefined
    if (type && msg) return `${type}: ${msg}`
    if (msg) return msg
    if (type) return type
    const code = typeof err.code === 'string' ? err.code : undefined
    if (code) return code
  }

  const msg = typeof json.message === 'string' ? json.message : undefined
  if (msg) return msg

  const reason = typeof json.error === 'string' ? json.error : undefined
  if (reason) return reason

  return message
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
