import { forwardRef, useImperativeHandle, useRef, useState, useMemo, useCallback } from 'react'
import { View, ScrollView } from 'react-native'

import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { useSettingValue } from '@/store/setting/hook'
import { createStyle } from '@/utils/tools'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import leaderboardState, { type Source, type BoardItem } from '@/store/leaderboard/state'

export interface SourceTabsProps {
  onSourceChange: (source: Source) => void
  onBoardChange: (board: BoardItem) => void
}

export interface SourceTabsType {
  setSource: (source: Source) => void
  setBoards: (boards: BoardItem[], activeBoardId: string) => void
}

export default forwardRef<SourceTabsType, SourceTabsProps>(({ onSourceChange, onBoardChange }, ref) => {
  const theme = useTheme()
  const t = useI18n()
  const sourceNameType = useSettingValue('common.sourceNameType')
  const [activeSource, setActiveSource] = useState<Source>('kw')
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [activeBoardId, setActiveBoardId] = useState('')

  const sources = useMemo(() => leaderboardState.sources, [])

  const sourceNames = useMemo(() => {
    return sources.map(s => t(`source_${sourceNameType}_${s}`))
  }, [sources, sourceNameType, t])

  useImperativeHandle(ref, () => ({
    setSource(source) {
      setActiveSource(source)
    },
    setBoards(newBoards, activeId) {
      setBoards(newBoards)
      setActiveBoardId(activeId)
    },
  }), [])

  const handleSourceChange = useCallback((source: Source) => {
    setActiveSource(source)
    onSourceChange(source)
  }, [onSourceChange])

  const handleBoardChange = useCallback((board: BoardItem) => {
    setActiveBoardId(board.id)
    onBoardChange(board)
  }, [onBoardChange])

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
      <View style={styles.boardRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
          {boards.map(board => (
            activeBoardId === board.id ? (
              <View style={{ ...styles.boardBtn, borderBottomColor: theme['c-primary-font'] }} key={board.id}>
                <Text size={13} color={theme['c-primary-font']} style={{ fontWeight: '600' }}>{board.name}</Text>
              </View>
            ) : (
              <Button
                style={styles.boardBtn}
                key={board.id}
                onPress={() => handleBoardChange(board)}
              >
                <Text size={13} color={theme['c-font']}>{board.name}</Text>
              </Button>
            )
          ))}
        </ScrollView>
      </View>
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
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
  boardRow: {
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
  },
  boardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
})