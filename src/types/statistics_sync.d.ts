declare namespace LX {
  namespace Sync {
    namespace Statistics {
      interface ListInfo {
        lastSyncDate?: number
        snapshotKey: string
      }

      interface SyncActionBase<A> {
        action: A
      }
      interface SyncActionData<A, D> extends SyncActionBase<A> {
        data: D
      }
      type SyncAction<A, D = undefined> = D extends undefined ? SyncActionBase<A> : SyncActionData<A, D>

      // 统计是 CRDT，收发双方都按 merge 处理，无需 sync_mode 协商
      type ActionList = SyncAction<'statistics_data_sync', LX.Statistics.StatisticsData>
    }
  }
}
