// THIS FILE SHOULD NOT BE MODIFIED BY ANY LLM

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const initialState = {
  foo: 'foo',
}

export const useOpencodeStore = create<typeof initialState>()(
  immer(() => initialState)
)
