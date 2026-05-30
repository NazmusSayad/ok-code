import { createContext } from 'daily-code/react'

type PromptInputContextInput = {
  projectId: string
  sessionId: string
}

export const [PromptInputContextProvider, usePromptInputContext] =
  createContext(({}: PromptInputContextInput) => {
    throw new Error('usePromptInput must be used within a PromptInputProvider')
  })
