import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomTabBar from '../components/BottomTabBar'

export default () => {
  return (
    <>
      <Content />
      <PlayerBar isHome />
      <BottomTabBar />
    </>
  )
}
