import { useEffect, useState } from 'react'

/**
 * 「音源能力变了」的重渲染脉冲：订阅 apiSourceUpdated 返回自增 tick。
 * 渲染期直接读 global.lx.qualityList 的展示都以它作 memo 依赖。
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
