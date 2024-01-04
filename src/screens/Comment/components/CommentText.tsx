import { memo, useMemo, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'

const TEXT_LIMIT = 160
const SUB_TEXT_LIMIT = TEXT_LIMIT * 1.2
// const CHAR_RXP = /\n/g

export default memo(({ text }: { text: string }) => {
  const [show, setShow] = useState(false)
  const theme = useTheme()

  const length = useMemo(() => {
    // text.length + (text.match(CHAR_RXP)?.length ?? 0) * 40
    let count = 0
    let bCount = 0
    let subLength = 0
    for (let i = 0; i < text.length; i++) {
      let char = text.charAt(i)
      if (char == '\n') {
        count += bCount * 24 + 20
        bCount++
      } else {
        count++
        if (char.trim() != '') bCount &&= 0
      }
      if (!subLength && count > TEXT_LIMIT) subLength = i
      if (count >= SUB_TEXT_LIMIT) return subLength
    }
    return 0
  }, [text])

  return (
    length ? (
      <View>
        {
          show ? <Text selectable style={styles.text}>{text}</Text>
            : <Text selectable style={styles.text}>{text.substring(0, length)} <Text color={theme['c-font-label']}>……</Text></Text>
        }
        <TouchableOpacity style={styles.toggle} onPress={() => { setShow(!show) }}>
          <Text color={theme['c-primary-font']}>{show ? global.i18n.t('comment_hide_text') : global.i18n.t('comment_show_text')}</Text>
        </TouchableOpacity>

      </View>
    ) : <Text selectable style={styles.text}>{text}</Text>
  )
})

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
