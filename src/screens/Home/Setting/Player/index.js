import React, { memo, useMemo } from 'react'
import {
  View,
  Text,
} from 'react-native'

import Section from '../components/Section'
import IsPlayHighQuality from './IsPlayHighQuality'
import IsHandleAudioFocus from './IsHandleAudioFocus'
import MaxCache from './MaxCache'
import { useTranslation } from '@/plugins/i18n'

// import DorpDownMenu from '@/components/common/DorpDownMenu'
// import { useGetter, useDispatch } from '@/store'

// const playNextModes = [
//   { label: '列表循环', action: 'listLoop' },
//   { label: '列表随机', action: 'random' },
//   { label: '顺序播放', action: 'list' },
//   { label: '单曲循环', action: 'singleLoop' },
// ]

export default memo(() => {
  const { t } = useTranslation()

  // const [isShowModal, setIsShowModal] = useState(false)
  // const hideDialog = useCallback(() => setIsShowModal(false), [setIsShowModal])
  // const togglePlayMethod = useGetter('common', 'togglePlayMethod')

  // const togglePlayMethodName = useMemo(() => {
  //   const method = playNextModes.find(m => m.action == togglePlayMethod)
  //   return method ? method.label : '未知'
  // }, [togglePlayMethod])
  // const setPlayNextMode = useDispatch('common', 'setPlayNextMode')
  // console.log(themeList)
  // const handlePress = id => {
  //   setTheme(id)
  //   // console.log(AppColors)
  // }
  // const handleToggleMethodPress = ({ action }) => setPlayNextMode(action)

  return (
    <Section title={t('setting_play')}>
      <IsPlayHighQuality />
      <IsHandleAudioFocus />
      <MaxCache />
      {/* <View style={{ marginLeft: 15, marginBottom: 15 }}>
        <Text>播放歌曲切换方式</Text>
        <DorpDownMenu menus={playNextModes} onPress={handleToggleMethodPress}><Text style={{ padding: 10 }}>{togglePlayMethodName}</Text></DorpDownMenu>
      </View> */}
    </Section>
  )
})
