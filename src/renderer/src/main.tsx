import './styles/index.css'
import './styles/theme.css'

import { ThemeProvider } from 'next-themes'
import { createRoot } from 'react-dom/client'
import { App } from './app'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
)
