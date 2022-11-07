import { WebDavClient } from './webDav'
import { Logger } from './logger'
import { precacheAndRoute } from 'workbox-precaching'

declare const self: any

precacheAndRoute(self.__WB_MANIFEST, {
  ignoreURLParametersMatching: [/.*/]
})

self.addEventListener('install', (): void => {
  self.skipWaiting()
})

class WebServiceWorker{
  async sendEventToAllClients(event) {
    const clients = await self.clients.matchAll({type: 'window'});
    for (const client of clients) {
      client.postMessage(event);
    }
  }
  async onHealthEventRecieved(event) {
    event.ports[0].postMessage(true)
    this.sendEventToAllClients("IM A MESSAGE")
    Logger.success('up and running')
  }

  async onCopyEventRecieved(event) {
    const data = event.data
    const sourceSpaceId = data.sourceSpaceId
    const sourcePath = data.sourcePath
    const targetSpaceId = data.targetSpaceId
    const targetPath = data.targetPath
    const token = data.token

    Logger.info(`copy file from ${sourcePath} to ${targetPath}`)
    await WebDavClient.moveFile(sourceSpaceId, sourcePath, targetSpaceId, targetPath, token)
  }

  bindEventListener() {
    addEventListener('message', async(event): Promise<void> => {
      const eventType = event.data.type
      if (eventType === 'health') {
        await this.onHealthEventRecieved(event)
      }
      if (eventType === 'copy') {
        await this.onCopyEventRecieved(event)
      }
    })
  }
}

const webServiceWorker = new WebServiceWorker()
webServiceWorker.bindEventListener()
