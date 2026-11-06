import { useEffect, useMemo, useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import songlistState, { type SortInfo, type Source } from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { getSongListSetting } from '@/utils/data'

export interface SortTabProps {
  onSortChange?: (id: string) => void
}

export default ({ onSortChange }: SortTabProps) => {
  const [sortList, setSortList] = useState<SortInfo[]>([])
  const [activeId, setActiveId] = useState<SortInfo['id']>('')
  const t = useI18n()
  const theme = useTheme()

  useEffect(() => {
    void getSongListSetting().then(info => {
      const source = info.source as Source
      setSortList(songlistState.sortList[source] ?? [])
      setActiveId(info.sortId)
    })

    const handleSourceChange = (source: Source) => {
      setSortList(songlistState.sortList[source] ?? [])
      setActiveId(songlistState.sortList[source]?.[0]?.id ?? '')
    }
    global.app_event.on('songlistSourceChanged', handleSourceChange)

    return () => {
      global.app_event.off('songlistSourceChanged', handleSourceChange)
    }
  }, [])

  const sorts = useMemo(() => {
    return sortList.map(s => ({ label: t(`songlist_${s.tid}`), id: s.id }))
  }, [sortList, t])

  const handleSortChange = (id: string) => {
    setActiveId(id)
    onSortChange?.(id)
    global.app_event.songlistSortChanged(id)
  }

  if (!sorts.length) return null

  return (
    <View style={styles.container}>
      {
        sorts.map(s => (
          <TouchableOpacity
            style={{
              ...styles.button,
              backgroundColor: activeId == s.id ? theme['c-content-background'] : 'transparent',
              ...(activeId == s.id ? styles.buttonSelected : {}),
            }}
            onPress={() => { handleSortChange(s.id) }}
            key={s.id}
          >
            <Text style={styles.buttonText} color={activeId == s.id ? theme['c-primary-font-active'] : theme['c-font']}>{s.label}</Text>
          </TouchableOpacity>
        ))
      }
    </View>
  )
}

const styles = createStyle({
  container: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)',
    borderRadius: 14,
    padding: 2,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 12,
    height: 24,
    borderRadius: 12,
  },
  buttonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 13,
  },
})