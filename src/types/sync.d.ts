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
          dislike: boolean
        }

        onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

        remote: LX.Sync.ServerSyncActions
        remoteQueueList: LX.Sync.ServerSyncListActions
        remoteQueueDislike: LX.Sync.ServerSyncDislikeActions
      }


      interface ModeTypes {
        list: LX.Sync.List.SyncMode
        dislike: LX.Sync.Dislike.SyncMode
      }

      type ModeType = { [K in keyof ModeTypes]: { type: K, mode: ModeTypes[K] } }[keyof ModeTypes]

      interface UrlInfo {
        wsProtocol: string
        httpProtocol: string
        hostPath: string
        href: string
      }

      interface ListConfig {
        skipSnapshot: boolean
      }
      interface DislikeConfig {
        skipSnapshot: boolean
      }
      type ServerType = 'desktop-app' | 'server'
      interface EnabledFeatures {
        list?: false | ListConfig
        dislike?: false | DislikeConfig
      }
      type SupportedFeatures = Partial<{ [k in keyof EnabledFeatures]: number }>
    }
  }
}

export {}
