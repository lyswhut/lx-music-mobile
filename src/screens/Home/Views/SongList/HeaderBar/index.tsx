import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'

import { createStyle } from '@/utils/tools'
import songlistState, { type Source } from '@/store/songlist/state'
import Tag, { type TagType, type TagProps } from './Tag'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'

export interface HeaderBarProps {
  onTagChange: TagProps['onTagChange']
}

export interface HeaderBarType {
  setSource: (source: Source, sortId: string, tagName: string, tagId: string) => void
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onTagChange }, ref) => {
  const tagRef = useRef<TagType>(null)
  const theme = useTheme()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [activeSource, setActiveSource] = useState<Source>('kw')

  const sources = useMemo(() => songlistState.sources, [])
  const sourceNames = useMemo(() => {
    return sources.map(s => t(`source_${sourceNameType}_${s}`))
  }, [sources, sourceNameType, t])

  useImperativeHandle(ref, () => ({
    setSource(source, sortId, tagName, tagId) {
      setActiveSource(source)
      tagRef.current?.setSelectedTagInfo(source, tagName, tagId)
    },
  }), [])

  const handleSourceChange = useCallback((source: Source) => {
    setActiveSource(source)
    global.app_event.songlistSourceChanged(source)
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.sourceRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
          {sources.map((source, index) => (
            <Button
              key={source}
              style={styles.sourceBtn}
              onPress={() => handleSourceChange(source)}
            >
              <Text
                size={15}
                color={activeSource === source ? theme['c-primary-font'] : theme['c-font']}
                style={{ fontWeight: activeSource === source ? '600' : '400' }}
              >
                {sourceNames[index]}
              </Text>
            </Button>
          ))}
        </ScrollView>
      </View>
      <View style={styles.toolbar}>
        <Tag ref={tagRef} onTagChange={onTagChange} />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    zIndex: 2,
  },
  sourceRow: {
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
  },
  sourceBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbar: {
    flexDirection: 'column',
    paddingLeft: 0,
    paddingRight: 0,
    height: 64,
  },
})
