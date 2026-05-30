export async function initOpencode(ipcMain: Electron.IpcMain) {
  const { createOpencode } = await import('@opencode-ai/sdk')

  const { client } = await createOpencode()

  ipcMain.handle('opencode:getProjects', async () => {
    return client.project.list().then((result) => result.data ?? [])
  })

  ipcMain.handle('opencode:getSessions', async () => {
    return client.session.list().then((result) => result.data ?? [])
  })

  ipcMain.handle('opencode:getCommands', async () => {
    return client.command.list().then((result) => result.data ?? [])
  })

  ipcMain.handle(
    'opencode:getSessionMessages',
    async (_, sessionId: string) => {
      return client.session
        .messages({ path: { id: sessionId } })
        .then((result) => result.data ?? [])
    }
  )
}
