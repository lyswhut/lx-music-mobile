import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomBar from '../components/BottomBar'

export default () => {
  return (
    <>
      <Content />
      <PlayerBar isHome />
      <BottomBar />
    </>
  )
}
