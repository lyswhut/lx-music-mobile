import { Dimensions } from 'react-native'
import { getWindowSize } from './nativeModules/utils'

export type SizeHandler = (size: { width: number, height: number }) => void
export const windowSizeTools = {
  size: {
    width: 0,
    height: 0,
  },
  listeners: [] as SizeHandler[],
  getSize() {
    return this.size
  },
  onSizeChanged(handler: SizeHandler) {
    this.listeners.push(handler)

    return () => {
      this.listeners.splice(this.listeners.indexOf(handler), 1)
    }
  },
  async init() {
    Dimensions.addEventListener('change', () => {
      void getWindowSize().then((size) => {
        if (!size.width) return
        const scale = Dimensions.get('screen').scale
        size.width = Math.trunc(size.width / scale)
        size.height = Math.trunc(size.height / scale)
        this.size = size
        for (const handler of this.listeners) handler(size)
      })
    })
    const size = await getWindowSize()
    if (size.width) {
      const scale = Dimensions.get('screen').scale
      size.width = Math.trunc(size.width / scale)
      size.height = Math.trunc(size.height / scale)
      this.size = size
    } else {
      const window = Dimensions.get('window')
      this.size = {
        width: window.width,
        height: window.height,
      }
    }
    console.log('init windowSizeTools')
    return size
  },
}
