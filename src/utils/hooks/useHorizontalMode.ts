import { useWindowSize } from '@/utils/hooks'
import { isHorizontalMode } from '../tools'


export default () => {
  const windowSize = useWindowSize()

  return isHorizontalMode(windowSize.width, windowSize.height)
}
