declare global {
  namespace LX {
    namespace Sync {
      interface Status {
        status: boolean
        message: string
      }

      interface KeyInfo {
        clientId: string
        key: string
        serverName: string
      }

      interface Socket extends WebSocket {
        isReady: boolean
        data: {
          keyInfo: KeyInfo
          urlInfo: UrlInfo
        }
        moduleReadys: {
          list: boolean
        }

        onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

        remote: LX.Sync.ServerSyncActions
        remoteQueueList: LX.Sync.ServerSyncListActions
      }


      interface UrlInfo {
        wsProtocol: string
        httpProtocol: string
        hostPath: string
        href: string
      }

      type ServerType = 'desktop-app' | 'server'
      interface EnabledFeatures {
        list: boolean
      }
      type SupportedFeatures = Partial<{ [k in keyof EnabledFeatures]: number }>
    }
  }
}

export {}
