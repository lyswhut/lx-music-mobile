declare global {
  namespace LX {
    namespace Statistics {
      /** 单台设备的统计桶 */
      interface DeviceStatistics {
        totalDuration: number
        dailyStats: Record<string, number>
        sourceStats: Record<string, number>
        firstUseDate: string
        platform?: string
        deviceName?: string
      }

      /** 分桶结构（持久化 + 同步） */
      interface StatisticsData {
        version: 2
        devices: Record<string, DeviceStatistics>
      }
    }
  }
}

export {}
