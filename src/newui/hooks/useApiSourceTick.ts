import { useEffect, useState } from 'react'

/**
 * 「音源能力变了」的重渲染脉冲：订阅 state_event 的 apiSourceUpdated，返回自增 tick。
 * 触发时机 = core/apiSource.ts L40（用户切源）与 core/init/userApi/index.ts L179
 * （启动加载完成后写入 global.lx.qualityList 并广播）。
 * 凡是在渲染期直接读 global.lx.qualityList 的展示（可播平台、音质档位）都以它作 memo 依赖。
 */
export const useApiSourceTick = (): number => {
  const [tick, setTick] = useState(0)
  const handleUpdate = () => setTick(t => t + 1)

  useEffect(() => {
    global.state_event.on('apiSourceUpdated', handleUpdate)
    return () => {
      global.state_event.off('apiSourceUpdated', handleUpdate)
    }
  }, [])

  return tick
}
