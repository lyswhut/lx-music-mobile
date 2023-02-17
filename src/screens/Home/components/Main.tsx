import React, { useEffect, useMemo, useState } from 'react'
import { InteractionManager, KeyboardAvoidingView } from 'react-native'
import Search from '../Views/Search'
import SongList from '../Views/SongList'
import Mylist from '../Views/Mylist'
import Leaderboard from '../Views/Leaderboard'
import Setting from '../Views/Setting'
import { createStyle } from '@/utils/tools'
import commonState, { type InitState as CommonState } from '@/store/common/state'


const Main = () => {
  const [id, setId] = useState(commonState.navActiveId)

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      requestAnimationFrame(() => {
        void InteractionManager.runAfterInteractions(() => {
          setId(id)
        })
      })
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
    }
  }, [])

  const component = useMemo(() => {
    switch (id) {
      case 'nav_songlist': return <SongList />
      case 'nav_top': return <Leaderboard />
      case 'nav_love': return <Mylist />
      case 'nav_setting': return <Setting />
      case 'nav_search':
      default: return <Search />
    }
  }, [id])

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={styles.container}
    >
      {component}
    </KeyboardAvoidingView>
  )
}

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    // backgroundColor: '#fff',
  },
})

export default Main

