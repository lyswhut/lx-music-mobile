import { useMemo, useCallback } from 'react'
import { useSelector } from 'react-redux'
import * as modules from './modules'

// console.log(modules)
const defaultGetter = state => state

const getter = (moduleName, key) => {
  const getters = modules[moduleName].getter
  if (getters && getters[key]) return getters[key]
  console.warn('getter not found:', moduleName, key)
  return defaultGetter
}

const useGetter = (moduleName, key, props) => {
  const memoGetter = useMemo(() => {
    return getter(moduleName, key)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const selecteor = useCallback(state => memoGetter(state, props), [props])

  // console.log(selector)
  // console.log(moduleName, key)
  return useSelector(selecteor)
}

export {
  getter,
  useGetter,
}
