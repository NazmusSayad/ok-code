import { AppSidebar } from './components/app-sidebar'
import { Button } from './components/ui/button'

export function App() {
  function ipcHandle(): void {
    return window.electron.ipcRenderer.send('ping')
  }

  return (
    <div className="grid size-full grid-cols-[200px_1fr]">
      <AppSidebar />

      <div>
        <Button onClick={ipcHandle}>Send IPC</Button>
      </div>
    </div>
  )
}
