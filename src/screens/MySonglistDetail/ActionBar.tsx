import { memo } from 'react'
import { View } from 'react-native'
import Button from '@/components/common/Button'
import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSonglistInfo } from './state'
import { handlePlay } from './listAction'

export default memo(({ componentId, onEdit }: {
  componentId: string
  onEdit: () => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const info = useSonglistInfo()

  const back = () => {
    void pop(commonState.componentIds.home!)
  }

  const handlePlayAll = () => {
    if (!info.name) return
    void handlePlay(info.id, 0)
  }

  return (
    <View style={styles.container}>
      <Button onPress={onEdit} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>
          {t('my_songlist_edit')}
        </Text>
      </Button>
      <Button onPress={handlePlayAll} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>
          {t('play_all')}
        </Text>
      </Button>
      <Button onPress={back} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>
          {t('back')}
        </Text>
      </Button>
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
  },
  controlBtn: {
    flexGrow: 1,
    flexShrink: 1,
    width: '33%',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
  controlBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
})
