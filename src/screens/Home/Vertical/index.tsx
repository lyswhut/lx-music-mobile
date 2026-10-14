import { View } from 'react-native'
import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomNav from './BottomNav'

export default () => {
  return (
    <>
      <View style={{ flex: 1 }}>
        <Content />
      </View>
      <PlayerBar isHome />
      <View style={{ height: 2 }} />
      <BottomNav />
    </>
  )
}