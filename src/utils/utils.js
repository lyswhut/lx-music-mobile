import { NativeModules } from 'react-native'

const { UtilsModule } = NativeModules

export const exitApp = UtilsModule.exitApp

export const getSupportedAbis = UtilsModule.getSupportedAbis

export const installApk = (filePath, fileProviderAuthority) => UtilsModule.installApk(filePath, fileProviderAuthority)
