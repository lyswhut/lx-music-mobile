import React, { useEffect, useMemo, useState } from 'react'
import { InteractionManager } from 'react-native'
import Search from '../Views/Search'
import SongList from '../Views/SongList'
import Mylist from '../Views/Mylist'
import Leaderboard from '../Views/Leaderboard'
import Setting from '../Views/Setting'
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

  return component
}


export default Main

