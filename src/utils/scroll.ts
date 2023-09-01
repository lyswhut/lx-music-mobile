import { type NativeScrollEvent, type FlatList, type NativeSyntheticEvent } from 'react-native'

const easeInOutQuad = (t: number, b: number, c: number, d: number): number => {
  t /= d / 2
  if (t < 1) return (c / 2) * t * t + b
  t--
  return (-c / 2) * (t * (t - 2) - 1) + b
}

type Noop = () => void
const noop: Noop = () => {}

const handleScrollY = (element: FlatList<any>, info: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'], to: number, duration = 300, fn = noop): Noop => {
  if (element == null) {
    fn()
    return noop
  }

  const key = Math.random()


  const start = info.contentOffset.y
  let cancel = false
  if (to > start) {
    let maxScrollTop = info.contentSize.height - info.layoutMeasurement.height
    if (to > maxScrollTop) to = maxScrollTop
  } else if (to < start) {
    if (to < 0) to = 0
  } else {
    fn()
    return noop
  }
  const change = to - start
  const increment = 10
  if (!change) {
    fn()
    return noop
  }

  let currentTime = 0
  let val

  const animateScroll = () => {
    // @ts-expect-error
    if (cancel || element.lx_scrollKey != key) {
      fn()
      return
    }
    currentTime += increment
    val = Math.trunc(easeInOutQuad(currentTime, start, change, duration))
    element.scrollToOffset({ offset: val, animated: false })
    if (currentTime < duration) {
      setTimeout(animateScroll, increment)
    } else {
      fn()
    }
  }
  // @ts-expect-error
  element.lx_scrollKey = key
  requestAnimationFrame(() => {
    animateScroll()
  })

  return () => {
    cancel = true
  }
}
/**
  * 设置滚动条位置
  * @param element 要设置滚动的容器 dom
  * @param to 滚动的目标位置
  * @param duration 滚动完成时间 ms
  * @param fn 滚动完成后的回调
  * @param delay 延迟执行时间
  */
export const scrollTo = (element: FlatList<any>, info: NativeSyntheticEvent<NativeScrollEvent>['nativeEvent'], to: number, duration = 300, fn = () => {}, delay = 0): () => void => {
  let cancelFn: () => void
  let timeout: NodeJS.Timeout | null
  if (delay) {
    let scrollCancelFn: Noop
    cancelFn = () => {
      timeout == null ? scrollCancelFn?.() : clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      timeout = null
      scrollCancelFn = handleScrollY(element, info, to, duration, fn)
    }, delay)
  } else {
    cancelFn = handleScrollY(element, info, to, duration, fn) ?? noop
  }
  return cancelFn
}

