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

      type ListData = Omit<LX.List.ListDataFull, 'tempList'>

      type Mode = 'merge_local_remote'
      | 'merge_remote_local'
      | 'overwrite_local_remote'
      | 'overwrite_remote_local'
      | 'overwrite_local_remote_full'
      | 'overwrite_remote_local_full'
      // | 'none'
      | 'cancel'

      interface Socket extends WebSocket {
        isReady: boolean
        data: {
          keyInfo: KeyInfo
          urlInfo: UrlInfo
        }

        onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

        remoteSyncList: LX.Sync.ServerActions
      }


      interface UrlInfo {
        wsProtocol: string
        httpProtocol: string
        hostPath: string
        href: string
      }
    }
  }
}

export {}
