import { Outlet, Route, Routes } from 'react-router-dom'
import { AppSidebar } from './components/app-sidebar'
import { ProjectDetail } from './components/project-detail'
import { SessionMessages } from './components/session-messages'

export function App() {
  return (
    <Routes>
      <Route
        element={
          <div className="grid size-full grid-cols-[240px_1fr] overflow-hidden">
            <AppSidebar />

            <Outlet />
          </div>
        }
      >
        <Route
          index
          element={
            <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Select a project from the sidebar
            </main>
          }
        />
        <Route path="project/:projectId" element={<ProjectDetail />} />

        <Route
          path="project/:projectId/session/:sessionId"
          element={<SessionMessages />}
        />
      </Route>
    </Routes>
  )
}
