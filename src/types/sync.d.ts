declare global {
  namespace LX {
    namespace Sync {

      interface Enable {
        enable: boolean
        port: string
      }

      interface SyncActionBase <A> {
        action: A
      }
      interface SyncActionData<A, D> extends SyncActionBase<A> {
        data: D
      }
      type SyncAction<A, D = undefined> = D extends undefined ? SyncActionBase<A> : SyncActionData<A, D>

      // type SyncMainWindowActions = SyncAction<'select_mode', KeyInfo>
      // | SyncAction<'close_select_mode'>
      // | SyncAction<'status', Status>

      // type SyncServiceActions = SyncAction<'select_mode', Mode>
      // | SyncAction<'get_status'>
      // | SyncAction<'generate_code'>
      // | SyncAction<'enable', Enable>

    type ActionList = SyncAction<'list_data_overwrite', LX.List.ListActionDataOverwrite>
    | SyncAction<'list_create', LX.List.ListActionAdd>
    | SyncAction<'list_remove', LX.List.ListActionRemove>
    | SyncAction<'list_update', LX.List.ListActionUpdate>
    | SyncAction<'list_update_position', LX.List.ListActionUpdatePosition>
    | SyncAction<'list_music_add', LX.List.ListActionMusicAdd>
    | SyncAction<'list_music_move', LX.List.ListActionMusicMove>
    | SyncAction<'list_music_remove', LX.List.ListActionMusicRemove>
    | SyncAction<'list_music_update', LX.List.ListActionMusicUpdate>
    | SyncAction<'list_music_update_position', LX.List.ListActionMusicUpdatePosition>
    | SyncAction<'list_music_overwrite', LX.List.ListActionMusicOverwrite>
    | SyncAction<'list_music_clear', LX.List.ListActionMusicClear>

    type ActionSync = SyncAction<'list:sync:list_sync_get_md5', string>
    | SyncAction<'list:sync:list_sync_get_list_data', ListData>
    | SyncAction<'list:sync:list_sync_get_sync_mode', Mode>
    | SyncAction<'list:sync:action', ActionList>
    // | SyncAction<'finished'>

    type ActionSyncType = Actions<ActionSync>

    type ActionSyncSend = SyncAction<'list:sync:list_sync_get_md5'>
    | SyncAction<'list:sync:list_sync_get_list_data'>
    | SyncAction<'list:sync:list_sync_get_sync_mode'>
    | SyncAction<'list:sync:list_sync_set_data', LX.Sync.ListData>
    | SyncAction<'list:sync:action', ActionList>
    | SyncAction<'list:sync:finished'>

    type ActionSyncSendType = Actions<ActionSyncSend>


    interface List {
      action: string
      data: any
    }

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

        onRemoteEvent: <T extends keyof LX.Sync.ActionSyncSendType>(
          eventName: T,
          handler: (data: LX.Sync.ActionSyncSendType[T]) => (void | Promise<void>)
        ) => () => void

        onClose: (handler: (err: Error) => (void | Promise<void>)) => () => void

        sendData: <T extends keyof LX.Sync.ActionSyncType>(
          eventName: T,
          data?: LX.Sync.ActionSyncType[T],
          callback?: (err?: Error) => void
        ) => void
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
