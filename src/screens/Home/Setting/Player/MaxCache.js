import React, { memo, useMemo, useCallback } from 'react'
import { View } from 'react-native'

import { useGetter, useDispatch } from '@/store'

import InputItem from '../components/InputItem'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'

export default memo(() => {
  const { t } = useTranslation()
  const playerCacheSize = useGetter('common', 'playerCacheSize')
  const setPlayerCacheSize = useDispatch('common', 'setPlayerCacheSize')

  const size = useMemo(() => {
    let size = parseInt(playerCacheSize)
    if (size == 0 || Number.isNaN(size)) size = ''
    return size.toString()
  }, [playerCacheSize])

  const setSize = useCallback((value, callback) => {
    let size = parseInt(value)
    if (Number.isNaN(size)) size = 0
    callback(size)
    if (playerCacheSize == size) return
    setPlayerCacheSize(size)
    toast(t('setting_play_cache_size_save_tip'))
  }, [playerCacheSize, setPlayerCacheSize, t])

  return (
    <View style={{ marginTop: 15 }} >
      <InputItem
        value={size}
        label={t('setting_play_cache_size')}
        onChange={setSize}
        keyboardType="number-pad"
        placeholder={t('setting_play_cache_size_no_cache')} />
    </View>
  )
})
