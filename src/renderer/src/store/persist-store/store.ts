import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
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
          variant?: string
        }
      >
    }
  >,
}

export const usePersistStore = create<typeof initialState>()(
  persist(
    immer(() => initialState),
    {
      version: 0,
      name: 'persist-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sessionSelection: state.sessionSelection }),
    }
  )
)
