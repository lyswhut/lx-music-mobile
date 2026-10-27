import { NativeModules, Platform } from 'react-native'
import { useEffect, useState } from 'react'
import settingState from '@/store/setting/state'
import { normalizeSoundEffect } from './config'

const native = NativeModules.SoundEffectModule as { configure: (config: ReturnType<typeof normalizeSoundEffect>) => Promise<void> } | undefined
export const isSoundEffectSupported = Platform.OS == 'android' && !!native
let initialized = false
let generation = 0
let lastConfig = ''
let status: 'ready' | 'loading' | 'error' = 'ready'
const listeners = new Set<() => void>()

const setStatus = (value: typeof status) => {
  status = value
  listeners.forEach(listener => { listener() })
}

export const applySoundEffect = async() => {
  if (!isSoundEffectSupported || !native) return
  const config = normalizeSoundEffect(settingState.setting)
  const serialized = JSON.stringify(config)
  if (serialized == lastConfig && status != 'error') return
  lastConfig = serialized
  const current = ++generation
  setStatus('loading')
  try {
    await native.configure(config)
    if (current == generation) setStatus('ready')
  } catch (error) {
    if (current != generation) return
    console.error('Sound effect configuration failed', error)
    setStatus('error')
  }
}

export const initSoundEffect = async() => {
  if (!initialized && isSoundEffectSupported) {
    initialized = true
    global.state_event.on('configUpdated', keys => {
      if (keys.some(key => key.startsWith('player.soundEffect.') && key != 'player.soundEffect.presets')) void applySoundEffect()
    })
  }
  await applySoundEffect()
}

export const useSoundEffectStatus = () => {
  const [value, setValue] = useState(status)
  useEffect(() => {
    const listener = () => { setValue(status) }
    listeners.add(listener)
    listener()
    return () => { listeners.delete(listener) }
  }, [])
  return value
}
