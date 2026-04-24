import { memo, useMemo } from 'react'

import { StyleSheet, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import CheckBox from '@/components/common/CheckBox'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useI18n } from '@/lang'

const LYRIC_TYPES: Array<{ type: LX.AppSetting['download.lyricType'], label: string }> = [
  { type: 'embed', label: 'download_lyric_embed' },
  { type: 'separate', label: 'download_lyric_separate' },
] as const

const useActive = (type: LX.AppSetting['download.lyricType']) => {
  const lyricType = useSettingValue('download.lyricType')
  const isActive = useMemo(() => lyricType == type, [lyricType, type])
  return isActive
}

const Item = ({ type, label }: {
  type: LX.AppSetting['download.lyricType']
  label: string
}) => {
  const isActive = useActive(type)
  return <CheckBox marginRight={8} check={isActive} label={label} onChange={() => { updateSetting({ 'download.lyricType': type }) }} need />
}

export default memo(() => {
  const t = useI18n()

  const list = useMemo(() => {
    return LYRIC_TYPES.map((item) => ({ type: item.type, label: t(item.label) }))
  }, [t])

  return (
    <SubTitle title={t('download_lyric_label')}>
      <View style={styles.list}>
        {
          list.map(({ type, label }) => <Item key={type} type={type} label={label} />)
        }
      </View>
    </SubTitle>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
