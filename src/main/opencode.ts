import { OpenCodePublicAPI } from '../core/opencode-public-api'

export async function initOpencode(ipcMain: Electron.IpcMain) {
  const { createOpencode } = await import('@opencode-ai/sdk/v2')

  const opencode = await createOpencode()

  const methods = Object.getOwnPropertyNames(OpenCodePublicAPI.prototype)
  methods.forEach((method) => {
    if (method === 'constructor') return

    const channel = `opencode:${method}`
    console.log('Registering IPC handler for method:', channel)

    ipcMain.handle(channel, async (event, ...args) => {
      const instance = new OpenCodePublicAPI(opencode, event)
      return instance[method](...args)
    })
  })
}
