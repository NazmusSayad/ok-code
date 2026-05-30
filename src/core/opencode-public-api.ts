import { OpencodeClient } from '@opencode-ai/sdk/v2'

type OpenCodeInstance = {
  client: OpencodeClient
  server: { url: string; close(): void }
}

export class OpenCodePublicAPI {
  private client: OpencodeClient

  constructor(opencode: OpenCodeInstance, _event: Electron.IpcMainInvokeEvent) {
    this.client = opencode.client
  }

  public async getProjects() {
    const { data } = await this.client.project.list()
    return data ?? []
  }
}
