import { NativeModules } from 'react-native'

const { GzipModule } = NativeModules

export const gzipFile = async(sourceFilePath: string, targetFilePath: string): Promise<string> => {
  console.log(sourceFilePath, targetFilePath)
  return GzipModule.gzipFile(sourceFilePath, targetFilePath, true)
}

export const unGzipFile = async(sourceFilePath: string, targetFilePath: string): Promise<string> => {
  return GzipModule.unGzipFile(sourceFilePath, targetFilePath, true)
}

export const gzipStringToBase64 = async(data: string): Promise<string> => {
  return GzipModule.gzipStringToBase64(data)
}

export const unGzipFromBase64 = async(data: string): Promise<string> => {
  return GzipModule.unGzipFromBase64(data)
}
