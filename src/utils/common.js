import { PermissionsAndroid } from 'react-native'


export const checkStoragePermissions = () => PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)

export const requestStoragePermission = async() => {
  const isGranted = await checkStoragePermissions()
  if (isGranted) return isGranted

  try {
    const granted = await PermissionsAndroid.requestMultiple(
      [
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ],
      // {
      //   title: '存储读写权限申请',
      //   message:
      //     '洛雪音乐助手需要使用存储读写权限才能下载歌曲.',
      //   buttonNeutral: '一会再问我',
      //   buttonNegative: '取消',
      //   buttonPositive: '确定',
      // },
    )
    // console.log(granted)
    // console.log(Object.values(granted).every(r => r === PermissionsAndroid.RESULTS.GRANTED))
    // console.log(PermissionsAndroid.RESULTS)
    const granteds = Object.values(granted)
    return granteds.every(r => r === PermissionsAndroid.RESULTS.GRANTED)
      ? true
      : granteds.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
        ? null
        : false
    // if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    //   console.log('You can use the storage')
    // } else {
    //   console.log('Storage permission denied')
    // }
  } catch (err) {
    console.warn(err)
    return err.message
  }
}

