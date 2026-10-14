import { memo, useEffect } from 'react'
import { View, AppState } from 'react-native'

import Header from './components/Header'
import Player from './Player'
import Lyric from './Lyric'
import MoreBtn from './Player/components/MoreBtn'
import Image from '@/components/common/Image'
import { screenkeepAwake, screenUnkeepAwake } from '@/utils/nativeModules/utils'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import { createStyle } from '@/utils/tools'
import { NAV_SHEAR_NATIVE_IDS } from '@/config/constant'
import { usePlayerMusicInfo } from '@/store/player/hook'

export default memo(({ componentId }: { componentId: string }) => {
  const musicInfo = usePlayerMusicInfo()

  useEffect(() => {
    screenkeepAwake()

    let appstateListener = AppState.addEventListener('change', (state) => {
      switch (state) {
        case 'active':
          if (!commonState.componentIds.comment) screenkeepAwake()
          break
        case 'background':
          screenUnkeepAwake()
          break
      }
    })

    const handleComponentIdsChange = (ids: CommonState['componentIds']) => {
      if (ids.comment) screenUnkeepAwake()
      else if (AppState.currentState == 'active') screenkeepAwake()
    }

    global.state_event.on('componentIdsUpdated', handleComponentIdsChange)

    return () => {
      global.state_event.off('componentIdsUpdated', handleComponentIdsChange)
      appstateListener.remove()
      screenUnkeepAwake()
    }
  }, [])

  return (
    <>
      <Header />
      <View style={styles.container}>
        <View style={styles.picContainer}>
          <Image url={musicInfo.pic} nativeID={NAV_SHEAR_NATIVE_IDS.playDetail_pic} style={styles.pic} />
        </View>
        <View style={styles.lyricContainer}>
          <View style={styles.lyricContent}>
            <Lyric />
          </View>
          <MoreBtn />
        </View>
      </View>
      <Player />
    </>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 30,
  },
  picContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  pic: {
    width: '100%',
    height: '100%',
  },
  lyricContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  lyricContent: {
    flex: 1,
  },
})
