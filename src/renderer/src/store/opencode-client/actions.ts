import { useOpencodeStore } from './store'

export function selectSessionAgent(
  projectId: string,
  sessionId: string,
  agent: string
) {
  useOpencodeStore.setState((state) => {
    const key = `${projectId}:${sessionId}`
    state.sessionSelection[key] ??= []
    state.sessionSelection[key].agent = agent
  })
}

export function selectSessionModel(
  projectId: string,
  sessionId: string,
  model: string
) {
  useOpencodeStore.setState((state) => {
    const key = `${projectId}:${sessionId}`
    state.sessionSelection[key] ??= []
    state.sessionSelection[key].model = model
  })
}

export function selectSessionModelVariant(
  projectId: string,
  sessionId: string,
  variant: string
) {
  useOpencodeStore.setState((state) => {
    const key = `${projectId}:${sessionId}`
    state.sessionSelection[key] ??= []
    state.sessionSelection[key].variant = variant
  })
}
