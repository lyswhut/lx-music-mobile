import { NativeModules } from 'react-native'

const { CacheModule } = NativeModules

export const getAppCacheSize = () => CacheModule.getAppCacheSize().then(size => parseInt(size))
export const clearAppCache = CacheModule.clearAppCache
