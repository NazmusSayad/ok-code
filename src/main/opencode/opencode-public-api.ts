import { OpencodeClient } from '@opencode-ai/sdk'

type OpenCodeInstance = {
  client: OpencodeClient
  server: { url: string; close(): void }
}

export class OpenCodePublicAPI {
  private opencode: OpenCodeInstance
  constructor(opencode: OpenCodeInstance) {
    this.opencode = opencode
  }

  public getClient() {
    return this.opencode.client
  }
}
