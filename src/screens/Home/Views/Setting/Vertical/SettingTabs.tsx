import { memo, useEffect, useMemo, useRef } from 'react'
import { ScrollView, TouchableOpacity } from 'react-native'

import { BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { SETTING_SCREENS } from '../Main'

export default memo(({ activeIndex, onChange }: {
  activeIndex: number
  onChange: (index: number) => void
}) => {
  const theme = useTheme()
  const t = useI18n()
  const scrollRef = useRef<ScrollView>(null)
  const itemXRef = useRef<Record<number, number>>({})

  const tabs = useMemo(() => {
    return SETTING_SCREENS.map((id, index) => {
      let label = t(`setting_${id}`)
      if (id == 'version') label = label.replace(/^软件/, '')
      else if (id == 'about') label = label.replace(/\s*LX Music$/, '')
      else label = label.replace(/设置$/, '')
      return { id, index, label }
    })
  }, [t])

  useEffect(() => {
    const x = itemXRef.current[activeIndex]
    if (x == null) return
    scrollRef.current?.scrollTo({ x: Math.max(0, x - 60), animated: true })
  }, [activeIndex])

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      {tabs.map(item => (
        <TouchableOpacity
          key={item.id}
          style={styles.button}
          onPress={() => { onChange(item.index) }}
          onLayout={(e) => { itemXRef.current[item.index] = e.nativeEvent.layout.x }}
        >
          <Text
            size={14}
            style={{
              ...styles.buttonText,
              borderBottomColor: activeIndex === item.index ? theme['c-primary-background-active'] : 'transparent',
              fontWeight: activeIndex === item.index ? 'bold' : 'normal',
            }}
            color={activeIndex === item.index ? theme['c-primary-font-active'] : theme['c-font']}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
})

const styles = createStyle({
  list: {
    height: 36,
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingLeft: 12,
    paddingRight: 12,
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  buttonText: {
    textAlign: 'center',
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 3,
    paddingBottom: 3,
    borderBottomWidth: BorderWidths.normal3,
  },
})
