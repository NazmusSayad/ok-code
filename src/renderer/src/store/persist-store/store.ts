import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const initialState = {
  sessionSelection: {} as Record<
    `${string}:${string}`, // `${projectId}:${sessionId}`
    {
      agent?: string
      models?: Record<
        `${string}:${string}`, // `${providerId}:${modelId}`
        {
          providerId: string
          modelId: string
          variant: string
        }
      >
    }
  >,
}

export const usePersistStore = create<typeof initialState>()(
  immer(() => initialState)
)
