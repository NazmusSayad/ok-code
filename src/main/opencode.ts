export async function initOpencode(ipcMain: Electron.IpcMain) {
  const { createOpencode } = await import('@opencode-ai/sdk/v2')

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
    async (
      _,
      sessionID: string,
      options: { limit?: number; before?: string }
    ) => {
      return client.session
        .messages({ sessionID, ...options })
        .then((result) => result.data ?? [])
    }
  )
}
