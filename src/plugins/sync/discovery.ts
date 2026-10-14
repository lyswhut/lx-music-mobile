import { request } from './client/utils'
import { getWIFIIPV4Address } from '@/utils/nativeModules/utils'

// 与桌面端同步服务的握手标识一致（GET /hello 响应前缀）
const HELLO_PREFIX = 'Hello~::^-^::'
const DEFAULT_PORT = 23332
const CONCURRENCY = 32
const SCAN_TIMEOUT = 1500

const checkHost = async(ip: string, port: number) => {
  try {
    const { text } = await request(`http://${ip}:${port}/hello`, { timeout: SCAN_TIMEOUT })
    if (text.startsWith(HELLO_PREFIX)) return `http://${ip}:${port}`
  } catch {}
  return null
}

export const discoverSyncServer = async(port: number = DEFAULT_PORT) => {
  const address = await getWIFIIPV4Address()
  const prefix = (/^(\d{1,3}(?:\.\d{1,3}){2})\.\d{1,3}$/.exec(address))?.[1]
  const candidates = prefix ? Array.from({ length: 254 }, (_, i) => `${prefix}.${i + 1}`) : []
  // Android 模拟器中宿主机固定别名为 10.0.2.2，便于开发调试时发现宿主机上的服务端
  if (address.startsWith('10.0.2.')) candidates.unshift('10.0.2.2')
  const found: string[] = []
  let index = 0
  const worker = async() => {
    while (index < candidates.length) {
      const result = await checkHost(candidates[index++], port)
      if (result) found.push(result)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, worker))
  return found
}
