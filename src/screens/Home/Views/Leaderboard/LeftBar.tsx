import React, { forwardRef, useImperativeHandle, useRef } from 'react'
import { View } from 'react-native'

import SourceSelector, {
  type SourceSelectorType as _SourceSelectorType,
  // type SourceSelectorProps as _SourceSelectorProps,
} from '@/components/SourceSelector'
import BoardsList, { type BoardsListType, type BoardsListProps } from './BoardsList'
import { BorderWidths } from '@/theme'
import { createStyle } from '@/utils/tools'
import { handleCollect, handlePlay } from './listAction'
import boardState, { type InitState } from '@/store/leaderboard/state'
import { useTheme } from '@/store/theme/hook'
import { getBoardsList } from '@/core/leaderboard'

type Sources = Readonly<InitState['sources']>
// type SourceSelectorProps = _SourceSelectorProps<Sources>
type SourceSelectorType = _SourceSelectorType<Sources>

export interface LeftBarProps {
  onChangeList: (source: LX.OnlineSource, id: string) => void
}

export interface LeftBarType {
  setBound: (source: LX.OnlineSource, id: string) => void
}

export default forwardRef<LeftBarType, LeftBarProps>(({ onChangeList }, ref) => {
  const theme = useTheme()
  const sourceSelectorRef = useRef<SourceSelectorType>(null)
  const boardsListRef = useRef<BoardsListType>(null)
  const boundInfo = useRef<{ source: LX.OnlineSource, id: string | null }>({ source: 'kw', id: null })
  useImperativeHandle(ref, () => ({
    setBound(source, listId) {
      boundInfo.current = { source, id: listId }
      sourceSelectorRef.current?.setSourceList(boardState.sources, source)
      void getBoardsList(source).then(list => {
        boardsListRef.current?.setList(list, listId)
      })
    },
  }), [])


  const onSourceChange = (source: LX.OnlineSource) => {
    boundInfo.current.source = source
    void getBoardsList(source).then(list => {
      const id = list[0].id
      requestAnimationFrame(() => {
        boardsListRef.current?.setList(list, id)
        requestAnimationFrame(() => {
          onChangeList(source, id)
        })
      })
    })
  }
  const onBoundChange: BoardsListProps['onBoundChange'] = (id) => {
    boundInfo.current.id = id
    onChangeList(boundInfo.current.source, id)
  }
  const onPlay: BoardsListProps['onPlay'] = (id) => {
    boundInfo.current.id = id
    void handlePlay(id, boardState.listDetailInfo.list)
  }
  const onCollect: BoardsListProps['onCollect'] = (id, name) => {
    boundInfo.current.id = id
    void handleCollect(id, name, boundInfo.current.source)
  }

  return (
    <View style={{ ...styles.container, borderRightColor: theme['c-list-header-border-bottom'] }}>
      <View style={styles.selector}>
        <SourceSelector ref={sourceSelectorRef} onSourceChange={onSourceChange} />
      </View>
      <BoardsList
        ref={boardsListRef}
        onBoundChange={onBoundChange}
        onPlay={onPlay}
        onCollect={onCollect}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'column',
    width: '26%',
    maxWidth: 180,
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: BorderWidths.normal,
  },
  selector: {
    height: 38,
  },
})

