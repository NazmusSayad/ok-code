import { Outlet, Route, Routes } from 'react-router-dom'
import { AppSidebar } from './components/app-sidebar'
import { SessionInbox } from './features/inbox/session-inbox'
import { ProjectDetailsPage } from './features/projects/project-details-page'

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
            <main className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              Select a project from the sidebar
            </main>
          }
        />

        <Route path="project/:projectId" element={<ProjectDetailsPage />} />

        <Route path="inbox/:projectId/:sessionId" element={<SessionInbox />} />
      </Route>
    </Routes>
  )
}
