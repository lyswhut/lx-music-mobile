import { useRef, forwardRef, useImperativeHandle, useState, useMemo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import SearchInput, { type SearchInputType, type SearchInputProps } from './SearchInput'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { type Source as MusicSource } from '@/store/search/music/state'
import { type Source as SonglistSource } from '@/store/search/songlist/state'
import Text from '@/components/common/Text'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import searchMusicState from '@/store/search/music/state'

type Sources = Readonly<Array<MusicSource | SonglistSource>>

export interface HeaderBarProps {
  onSourceChange: (source: Sources[number]) => void
  onTipSearch: SearchInputProps['onChangeText']
  onSearch: SearchInputProps['onSubmit']
  onHideTipList: SearchInputProps['onBlur']
  onShowTipList: SearchInputProps['onTouchStart']
}

export interface HeaderBarType {
  setSourceList: (list: Sources, activeSource: Sources[number]) => void
  setText: SearchInputType['setText']
  blur: SearchInputType['blur']
}

const useSourceListI18n = (list: Sources) => {
  const sourceNameType = useSettingValue('common.sourceNameType')
  const t = useI18n()
  return useMemo(() => {
    return list.map(s => ({ label: t(`source_${sourceNameType}_${s}`), action: s }))
  }, [list, sourceNameType, t])
}

export default forwardRef<HeaderBarType, HeaderBarProps>(({ onSourceChange, onTipSearch, onSearch, onHideTipList, onShowTipList }, ref) => {
  const searchInputRef = useRef<SearchInputType>(null)
  const theme = useTheme()
  const [list, setList] = useState<Sources>(searchMusicState.sources as Sources)
  const [source, setSource] = useState<Sources[number]>('kw')
  const sourceList_t = useSourceListI18n(list)

  useImperativeHandle(ref, () => ({
    setSourceList(newList, activeSource) {
      setList(newList)
      setSource(activeSource)
    },
    setText(text) {
      searchInputRef.current?.setText(text)
    },
    blur() {
      searchInputRef.current?.blur()
    },
  }), [])

  const handleSourceChange = (action: Sources[number]) => {
    setSource(action)
    onSourceChange(action)
  }

  return (
    <View style={styles.container}>
      <View style={styles.sourceList}>
        {
          sourceList_t.map(item => (
            <TouchableOpacity
              style={styles.sourceButton}
              onPress={() => { handleSourceChange(item.action) }}
              key={item.action}
            >
              <Text
                size={14}
                style={{ ...styles.sourceButtonText, fontWeight: source == item.action ? 'bold' : 'normal' }}
                color={source == item.action ? theme['c-primary-font-active'] : theme['c-font']}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))
        }
      </View>
      <View style={styles.searchRow}>
        <SearchInput
          ref={searchInputRef}
          onChangeText={onTipSearch}
          onSubmit={onSearch}
          onBlur={onHideTipList}
          onTouchStart={onShowTipList}
        />
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    zIndex: 2,
  },
  sourceList: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 2,
  },
  sourceButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
    paddingRight: 2,
    paddingBottom: 2,
  },
  sourceButtonText: {
    textAlign: 'center',
    paddingLeft: 1,
    paddingRight: 1,
    paddingTop: 3,
    paddingBottom: 3,
  },
  searchRow: {
    height: 38,
    paddingRight: 10,
    paddingLeft: 5,
  },
})