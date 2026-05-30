// THIS FILE SHOULD NOT BE MODIFIED BY ANY LLM

import type { Command, Project, Provider, Session } from '@opencode-ai/sdk'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const initialState = {
  projects: {
    data: [] as Project[],
    currentProjectId: null as string | null,

    isLoading: false as boolean,
    error: null as string | null,
  },

  session: {
    data: [] as Session[],

    isLoading: false as boolean,
    error: null as string | null,
  },

  command: {
    data: [] as Command[],

    isLoading: false as boolean,
    error: null as string | null,
  },

  provider: {
    data: [] as Provider[],
    connectedProviders: [] as string[],

    isLoading: false as boolean,
    error: null as string | null,
  },
}

export const useOpencodeStore = create<typeof initialState>()(
  immer(() => initialState)
)
