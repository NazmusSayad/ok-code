import { AssistantMessageDisplay, UserMessageDisplay } from './message-parts'

export function MessageItem(props: {
  msg: {
    info: import('@opencode-ai/sdk/v2').Message
    parts: import('@opencode-ai/sdk/v2').Part[]
  }
}) {
  const { msg } = props
  if (msg.info.role === 'user') {
    return (
      <UserMessageDisplay
        message={msg.info as import('@opencode-ai/sdk/v2').UserMessage}
        parts={msg.parts}
      />
    )
  }
  if (msg.info.role === 'assistant') {
    return (
      <AssistantMessageDisplay
        message={msg.info as import('@opencode-ai/sdk/v2').AssistantMessage}
        parts={msg.parts}
      />
    )
  }
  return null
}
