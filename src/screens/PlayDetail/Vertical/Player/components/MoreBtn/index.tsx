import { createStyle } from '@/utils/tools'
import { View } from 'react-native'
import PlayModeBtn from './PlayModeBtn'
import MusicAddBtn from './MusicAddBtn'
import DesktopLyricBtn from './DesktopLyricBtn'
import CommentBtn from './CommentBtn'

export default () => {
  return (
    <View style={styles.container}>
      <DesktopLyricBtn />
      <MusicAddBtn />
      <PlayModeBtn />
      <CommentBtn />
    </View>
  )
}


const styles = createStyle({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 5,
    // backgroundColor: 'rgba(0,0,0,0.1)',
  },
})
