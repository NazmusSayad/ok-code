import type { FilePart, Part, ToolPart } from '@opencode-ai/sdk/v2'

export function attached(part: FilePart) {
  return part.url.startsWith('data:')
}

export function inline(part: FilePart) {
  if (attached(part)) return false
  return (
    part.source?.text?.start !== undefined &&
    part.source?.text?.end !== undefined
  )
}

export function kind(part: FilePart) {
  return part.mime.startsWith('image/') ? 'image' : 'file'
}

export async function writeClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {}
  }
  // Fallback
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}

export type ToolInfo = {
  icon: string // lucide icon name as string for now
  title: string
  subtitle?: string
}

export function getToolInfo(
  tool: string,
  input: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {}
): ToolInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i = input as Record<string, any>

  switch (tool) {
    case 'read':
      return {
        icon: 'glasses',
        title: 'Read',
        subtitle: i.filePath ? String(i.filePath).split('/').pop() : undefined,
      }
    case 'list':
      return {
        icon: 'list',
        title: 'List',
        subtitle: i.path ? String(i.path).split('/').pop() : undefined,
      }
    case 'glob':
      return {
        icon: 'search',
        title: 'Glob',
        subtitle: i.pattern ? String(i.pattern) : undefined,
      }
    case 'grep':
      return {
        icon: 'search',
        title: 'Grep',
        subtitle: i.pattern ? String(i.pattern) : undefined,
      }
    case 'webfetch':
      return {
        icon: 'globe',
        title: 'Web Fetch',
        subtitle: i.url ? String(i.url) : undefined,
      }
    case 'websearch': {
      const provider = metadata?.provider as string | undefined
      const title =
        provider === 'parallel'
          ? 'Parallel Web Search'
          : provider === 'exa'
            ? 'Exa Web Search'
            : 'Web Search'
      return {
        icon: 'search',
        title,
        subtitle: i.query ? String(i.query) : undefined,
      }
    }
    case 'task': {
      const subagent =
        typeof i.subagent_type === 'string' ? i.subagent_type : undefined
      const type = subagent
        ? subagent[0].toUpperCase() + subagent.slice(1)
        : undefined
      return {
        icon: 'users',
        title: type ? `${type} Agent` : 'Agent',
        subtitle: i.description ? String(i.description) : undefined,
      }
    }
    case 'bash':
      return {
        icon: 'terminal',
        title: 'Shell',
        subtitle: i.description ? String(i.description) : undefined,
      }
    case 'edit':
      return {
        icon: 'edit',
        title: 'Edit',
        subtitle: i.filePath ? String(i.filePath).split('/').pop() : undefined,
      }
    case 'write':
      return {
        icon: 'file-plus',
        title: 'Write',
        subtitle: i.filePath ? String(i.filePath).split('/').pop() : undefined,
      }
    case 'apply_patch': {
      const files = Array.isArray(i.files) ? i.files : []
      return {
        icon: 'diff',
        title: 'Patch',
        subtitle: files.length
          ? `${files.length} file${files.length > 1 ? 's' : ''}`
          : undefined,
      }
    }
    case 'todowrite':
      return {
        icon: 'check-square',
        title: 'To-dos',
      }
    case 'question':
      return {
        icon: 'help-circle',
        title: 'Questions',
      }
    case 'skill':
      return {
        icon: 'brain',
        title: (i.name as string) || 'Skill',
      }
    default:
      return {
        icon: 'wrench',
        title: tool,
      }
  }
}

export function renderable(part: Part, showReasoningSummaries = true): boolean {
  if (part.type === 'tool') {
    if (part.tool === 'todowrite') return false
    if (part.tool === 'question')
      return part.state.status !== 'pending' && part.state.status !== 'running'
    return true
  }
  if (part.type === 'text') return !!part.text?.trim()
  if (part.type === 'reasoning')
    return showReasoningSummaries && !!part.text?.trim()
  if (
    part.type === 'compaction' ||
    part.type === 'retry' ||
    part.type === 'step-finish'
  )
    return true
  return false
}

// Context group tools (for grouping in the UI like the reference)
export const CONTEXT_GROUP_TOOLS = new Set(['read', 'glob', 'grep', 'list'])
export const HIDDEN_TOOLS = new Set(['todowrite'])

export function isContextGroupTool(part: Part): part is ToolPart {
  return part.type === 'tool' && CONTEXT_GROUP_TOOLS.has(part.tool)
}

export function partDefaultOpen(part: Part): boolean | undefined {
  if (part.type !== 'tool') return undefined
  if (part.tool === 'bash') return false
  if (
    part.tool === 'edit' ||
    part.tool === 'write' ||
    part.tool === 'apply_patch'
  )
    return true
  return undefined
}
