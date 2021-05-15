import AsyncStorage from '@react-native-async-storage/async-storage'

export const setData = async(key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    // saving error
    console.log(e.message)
    throw e
  }
}

export const getData = async key => {
  let value
  try {
    value = await AsyncStorage.getItem(key)
  } catch (e) {
    // error reading value
    console.log(e.message)
    throw e
  }
  if (value) value = JSON.parse(value)
  return value
}

export const removeData = async key => {
  try {
    await AsyncStorage.removeItem(key)
  } catch (e) {
    // remove error
    console.log(e.message)
    throw e
  }
}

export const getAllKeys = async() => {
  let keys
  try {
    keys = await AsyncStorage.getAllKeys()
  } catch (e) {
    // read key error
    console.log(e.message)
    throw e
  }

  return keys
}

export const getDataMultiple = async keys => {
  let values
  try {
    values = await AsyncStorage.multiGet(keys)
  } catch (e) {
    // read error
    console.log(e.message)
    throw e
  }
  return values.map(([key, value]) => ({ key, value: JSON.parse(value) }))
}

export const setDataMultiple = async datas => {
  try {
    await AsyncStorage.multiSet(datas.map(({ key, value }) => ([key, JSON.stringify(value)])))
  } catch (e) {
    // save error
    console.log(e.message)
    throw e
  }
}


export const removeDataMultiple = async keys => {
  if (!keys.length) return
  try {
    await AsyncStorage.multiRemove(keys)
  } catch (e) {
    // remove error
    console.log(e.message)
    throw e
  }
}

export const clearAll = async() => {
  try {
    await AsyncStorage.clear()
  } catch (e) {
    // clear error
    console.log(e.message)
    throw e
  }
}

export const useAsyncStorage = AsyncStorage.useAsyncStorage
