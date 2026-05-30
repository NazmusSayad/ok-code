import type { Project } from '@opencode-ai/sdk'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const initialState = {
  projects: {
    data: [] as Project[],
    error: null as string | null,
    isLoading: false as boolean,

    currentProjectId: null as string | null,
  },
}

export const useOpencodeStore = create<typeof initialState>()(
  immer(() => initialState)
)
