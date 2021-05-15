import { NativeModules } from 'react-native'

const { GzipModule } = NativeModules

export const gzip = (sourceFilePath, targetFilePath) => {
  console.log(sourceFilePath, targetFilePath)
  return GzipModule.gzip(sourceFilePath, targetFilePath, true)
}

export const ungzip = (sourceFilePath, targetFilePath) => {
  return GzipModule.unGzip(sourceFilePath, targetFilePath, true)
}
