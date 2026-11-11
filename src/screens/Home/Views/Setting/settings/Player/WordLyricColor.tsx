import { memo, useCallback, useMemo } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'

import SubTitle from '../../components/SubTitle'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { updateSetting } from '@/core/common'
import { WORD_LYRIC_COLOR_LIST } from '@/config/wordLyricColors'

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const color = useSettingValue('player.wordLyricColor')
  const setColor = useCallback((id: string) => {
    if (id == color) return
    updateSetting({ 'player.wordLyricColor': id })
  }, [color])
  const list = useMemo(() => WORD_LYRIC_COLOR_LIST.map(item => ({
    ...item,
    // 'theme' 项展示当前主题主色
    dotColor: item.color == 'theme' ? theme['c-primary'] : item.color,
  })), [theme])

  return (
    <SubTitle title={t('setting_play_word_lyric_color')}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.content}>
          {
            list.map(item => (
              <TouchableOpacity key={item.id} style={styles.colorItem} onPress={() => { setColor(item.id) }}>
                <View style={[styles.colorDot, { backgroundColor: item.dotColor }, color == item.id ? { borderColor: theme['c-font'] } : null]} />
              </TouchableOpacity>
            ))
          }
        </View>
      </ScrollView>
    </SubTitle>
  )
})

const styles = createStyle({
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  colorItem: {
    padding: 5,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
})
