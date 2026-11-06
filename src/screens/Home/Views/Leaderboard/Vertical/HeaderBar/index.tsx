import { forwardRef, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'

import { createStyle } from '@/utils/tools'
import SourceTabs, {
  type SourceTabsType,
} from './SourceTabs'
import { useTheme } from '@/store/theme/hook'
import { BorderWidths } from '@/theme'
import { type Source, type BoardItem } from '@/store/leaderboard/state'

export interface HeaderBarProps {
  onShowBound: () => void
  onSourceChange: (source: Source) => void
  onBoardChange: (board: BoardItem) => void
}

export interface HeaderBarType {
  setBound: (source: Source, id: string, name: string) => void
  setBoards: (boards: BoardItem[], activeBoardId: string) => void
}


export default forwardRef<HeaderBarType, HeaderBarProps>(({ onShowBound, onSourceChange, onBoardChange }, ref) => {
  const sourceTabsRef = useRef<SourceTabsType>(null)
  const theme = useTheme()

  useImperativeHandle(ref, () => ({
    setBound(source, id, name) {
      sourceTabsRef.current?.setSource(source)
    },
    setBoards(boards, activeBoardId) {
      sourceTabsRef.current?.setBoards(boards, activeBoardId)
    },
  }), [])


  return (
    <View style={{ ...styles.currentList, borderBottomColor: theme['c-border-background'] }}>
      <SourceTabs ref={sourceTabsRef} onSourceChange={onSourceChange} onBoardChange={onBoardChange} />
    </View>
  )
})

const styles = createStyle({
  currentList: {
    flexDirection: 'column',
    height: 64,
    zIndex: 2,
    borderBottomWidth: BorderWidths.normal,
  },
})