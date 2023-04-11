import { NativeModules } from 'react-native'

const { GzipModule } = NativeModules

export const gzip = (sourceFilePath: string, targetFilePath: string) => {
  console.log(sourceFilePath, targetFilePath)
  return GzipModule.gzip(sourceFilePath, targetFilePath, true)
}

export const ungzip = (sourceFilePath: string, targetFilePath: string) => {
  return GzipModule.unGzip(sourceFilePath, targetFilePath, true)
}
