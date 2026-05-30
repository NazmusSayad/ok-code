// THIS FILE SHOULD NOT BE MODIFIED BY ANY LLM

import type { Command, Project, Session } from '@opencode-ai/sdk'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const initialState = {
  projects: {
    data: [] as Project[],
    error: null as string | null,
    isLoading: false as boolean,

    currentProjectId: null as string | null,
  },

  session: {
    data: [] as Session[],
    error: null as string | null,
    isLoading: false as boolean,
    currentSessionId: null as string | null,
  },

  command: {
    data: [] as Command[],
    error: null as string | null,
    isLoading: false as boolean,
  },
}

export const useOpencodeStore = create<typeof initialState>()(
  immer(() => initialState)
)
