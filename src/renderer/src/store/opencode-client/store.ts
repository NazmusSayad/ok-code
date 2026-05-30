// THIS FILE SHOULD NOT BE MODIFIED BY ANY LLM

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const initialState = {
  sessionSelection: {} as {
    [key: `${string}:${string}`]: {
      agent?: string
      model?: string
      variant?: string
    }
  },
}

export const useOpencodeStore = create<typeof initialState>()(
  immer(() => initialState)
)
