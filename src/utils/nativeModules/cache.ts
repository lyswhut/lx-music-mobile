import { NativeModules } from 'react-native'

const { CacheModule } = NativeModules

export const getAppCacheSize = async(): Promise<number> => CacheModule.getAppCacheSize().then((size: number) => Math.trunc(size))
export const clearAppCache = CacheModule.clearAppCache as () => Promise<void>
