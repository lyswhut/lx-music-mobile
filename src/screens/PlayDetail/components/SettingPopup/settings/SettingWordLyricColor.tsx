import { useMemo } from 'react'

import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { updateSetting } from '@/core/common'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { WORD_LYRIC_COLOR_LIST } from '@/config/wordLyricColors'
import styles from './style'

export default () => {
  const t = useI18n()
  const theme = useTheme()
  const color = useSettingValue('player.wordLyricColor')
  const setColor = (id: string) => {
    if (id == color) return
    updateSetting({ 'player.wordLyricColor': id })
  }
  const list = useMemo(() => WORD_LYRIC_COLOR_LIST.map(item => ({
    ...item,
    // 'theme' 项展示当前主题主色
    dotColor: item.color == 'theme' ? theme['c-primary'] : item.color,
  })), [theme])

  return (
    <View style={styles.container}>
      <Text>{t('play_detail_setting_word_lyric_color')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.colorList}>
          {
            list.map(item => (
              <TouchableOpacity key={item.id} style={styles.colorItem} onPress={() => { setColor(item.id) }}>
                <View style={[styles.colorDot, { backgroundColor: item.dotColor }, color == item.id ? { borderColor: theme['c-font'] } : null]} />
              </TouchableOpacity>
            ))
          }
        </View>
      </ScrollView>
    </View>
  )
}
