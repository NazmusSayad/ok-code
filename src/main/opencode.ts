import { createOpencode } from '@opencode-ai/sdk'

export async function initOpencode(ipcMain: Electron.IpcMain) {
  const { client } = await createOpencode()

  ipcMain.handle('opencode:getProjects', async () => {
    return client.project.list().then((result) => result.data ?? [])
  })
}
