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

  public async getSessions() {
    const { data } = await this.client.session.list()
    return data ?? []
  }

  public async getSessionMessages(sessionID: string) {
    const { data } = await this.client.session.messages({ sessionID })
    return data ?? []
  }

  public async getAgents() {
    const { data } = await this.client.app.agents()
    return data ?? []
  }

  public async getModels() {
    const { data } = await this.client.v2.model.list()
    return data ?? []
  }

  public async sendPrompt(
    sessionID: string,
    text: string,
    opts?: { agent?: string; model?: string; variant?: string }
  ) {
    const modelObj = opts?.model
      ? (() => {
          const raw = opts.model!
          const [providerID, modelID] = raw.split(':')
          return providerID && modelID ? { providerID, modelID } : undefined
        })()
      : undefined

    await this.client.session.promptAsync({
      parts: [{ type: 'text', text }],
      sessionID,
      agent: opts?.agent,
      model: modelObj,
      variant: opts?.variant,
    })
  }

  public async abortPrompt(sessionId: string) {
    const { data } = await this.client.session.abort({ sessionID: sessionId })
    return data
  }
}
