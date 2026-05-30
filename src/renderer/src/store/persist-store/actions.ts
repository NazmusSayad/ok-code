import { usePersistStore } from './store'

function getKey(projectId: string, sessionId: string) {
  return `${projectId}:${sessionId}` as const
}

export function selectSessionAgent(
  projectId: string,
  sessionId: string,
  agent?: string
) {
  usePersistStore.setState((state) => {
    const key = getKey(projectId, sessionId)
    if (!state.sessionSelection[key]) state.sessionSelection[key] = {}
    if (agent) {
      state.sessionSelection[key].agent = agent
    } else {
      delete state.sessionSelection[key].agent
    }
  })
}

export function selectSessionModel(
  projectId: string,
  sessionId: string,
  providerId: string,
  modelId: string
) {
  usePersistStore.setState((state) => {
    const key = getKey(projectId, sessionId)
    if (!state.sessionSelection[key]) state.sessionSelection[key] = {}
    if (!state.sessionSelection[key].models)
      state.sessionSelection[key].models = {}
    const modelKey = `${providerId}:${modelId}` as const
    if (!state.sessionSelection[key].models[modelKey]) {
      state.sessionSelection[key].models[modelKey] = {
        providerId,
        modelId,
      }
    }
  })
}

export function setSessionModelVariant(
  projectId: string,
  sessionId: string,
  providerId: string,
  modelId: string,
  variant?: string
) {
  usePersistStore.setState((state) => {
    const key = getKey(projectId, sessionId)
    if (!state.sessionSelection[key]) state.sessionSelection[key] = {}
    if (!state.sessionSelection[key].models)
      state.sessionSelection[key].models = {}
    const modelKey = `${providerId}:${modelId}` as const
    if (!state.sessionSelection[key].models[modelKey]) {
      state.sessionSelection[key].models[modelKey] = {
        providerId,
        modelId,
      }
      if (variant) {
        state.sessionSelection[key].models[modelKey].variant = variant
      }
    } else {
      if (variant) {
        state.sessionSelection[key].models[modelKey].variant = variant
      } else {
        delete state.sessionSelection[key].models[modelKey].variant
      }
    }
  })
}

const EMPTY_SELECTION = {} as const

export function useSessionSelection(projectId: string, sessionId: string) {
  const key = getKey(projectId, sessionId)
  const data = usePersistStore((s) => s.sessionSelection[key])
  return data ?? EMPTY_SELECTION
}
