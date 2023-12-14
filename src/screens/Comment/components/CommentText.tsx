import { useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

const TEXT_LIMIT = 130

export default ({ text }: { text: string }) => {
  const [show, setShow] = useState(false)
  const theme = useTheme()


  return (
    text.length > TEXT_LIMIT ? (
      <View>
        {
          show ? <Text selectable style={styles.text}>{text}</Text>
            : <Text selectable style={styles.text}>{text.substring(0, TEXT_LIMIT)} <Text color={theme['c-font-label']}>……</Text></Text>
        }
        <TouchableOpacity style={styles.toggle} onPress={() => { setShow(!show) }}>
          <Text color={theme['c-primary-font']}>{show ? global.i18n.t('comment_hide_text') : global.i18n.t('comment_show_text')}</Text>
        </TouchableOpacity>

      </View>
    ) : <Text selectable style={styles.text}>{text}</Text>
  )
}

const styles = createStyle({
  text: {
    marginTop: 5,
    lineHeight: 19,
  },
  toggle: {
    marginTop: 15,
    alignSelf: 'flex-end',
  },
})
