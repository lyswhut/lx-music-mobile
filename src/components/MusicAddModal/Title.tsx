import React from 'react'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'

export default ({ musicInfo, isMove }: {
  musicInfo: LX.Music.MusicInfo
  isMove: boolean
}) => {
  const theme = useTheme()
  const t = useI18n()
  return (
    <Text style={styles.title}>
      {t(isMove ? 'list_add_title_first_move' : 'list_add_title_first_add')} <Text color={theme['c-primary-font']}>{musicInfo.name}</Text> {t('list_add_title_last')}
    </Text>
  )
}

const styles = createStyle({
  title: {
    textAlign: 'center',
    paddingTop: 15,
    paddingBottom: 15,
  },
})
