import { OpenCodePublicAPI } from './opencode-public-api'

export async function initOpencode(ipcMain: Electron.IpcMain) {
  const { createOpencode } = await import('@opencode-ai/sdk/v2')

  const opencode = await createOpencode()

  const methods = Object.getOwnPropertyNames(OpenCodePublicAPI.prototype)
  methods.forEach((method, ...args) => {
    if (method === 'constructor') return

    ipcMain.handle(`opencode:${method}}`, async (event) => {
      const instance = new OpenCodePublicAPI(opencode, event)
      return instance[method](...args)
    })
  })
}
