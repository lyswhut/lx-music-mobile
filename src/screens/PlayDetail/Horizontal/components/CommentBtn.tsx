import Btn from './Btn'
import { navigations } from '@/navigation'
import commonState from '@/store/common/state'


export default () => {
  const handleShowCommentScreen = () => {
    navigations.pushCommentScreen(commonState.componentIds.playDetail!)
  }

  return <Btn icon="comment" onPress={handleShowCommentScreen} />
}
