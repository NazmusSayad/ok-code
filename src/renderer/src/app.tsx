import { useEffect } from 'react'
import { AppSidebar } from './components/app-sidebar'
import { ProjectDetail } from './components/project-detail'
import { initialize, useOpencodeStore } from './store/opencode-client'

export function App() {
  useEffect(() => {
    void initialize()
  }, [])

  const currentProjectId = useOpencodeStore((s) => s.projects.currentProjectId)

  return (
    <div className="grid size-full grid-cols-[240px_1fr]">
      <AppSidebar />

      {currentProjectId && <ProjectDetail />}
    </div>
  )
}
