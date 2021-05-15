import React, { memo, useCallback, useState, useEffect } from 'react'
import { StyleSheet, View, Text, InteractionManager } from 'react-native'

import { useGetter, useDispatch } from '@/store'
// import { gzip, ungzip } from 'pako'

import SubTitle from '../components/SubTitle'
import Button from '../components/Button'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'
import { getAppCacheSize, clearAppCache } from '@/utils/cache'
import { sizeFormate } from '@/utils'

export default memo(() => {
  const { t } = useTranslation()
  const [cleaning, setCleaning] = useState(false)
  const [cacheSize, setCacheSize] = useState(null)
  // const setting = useGetter('common', 'setting')
  const theme = useGetter('common', 'theme')
  const clearCache = useDispatch('list', 'clearCache')

  const handleGetAppCacheSize = useCallback(() => {
    getAppCacheSize().then(size => {
      setCacheSize(sizeFormate(size))
    })
  }, [])

  const handleCleanCache = useCallback(() => {
    if (cacheSize == null) return
    setCleaning(true)
    InteractionManager.runAfterInteractions(() => {
      Promise.all([
        clearAppCache(),
        clearCache(),
      ]).then(() => {
        toast(t('setting_other_cache_clear_success_tip'))
      }).finally(() => {
        handleGetAppCacheSize()
        setCleaning(false)
      })
    })
  }, [cacheSize, clearCache, handleGetAppCacheSize, t])


  useEffect(() => {
    handleGetAppCacheSize()
  }, [])

  return (
    <>
      <SubTitle title={t('setting_other_cache')}>
        <View style={styles.cacheSize}>
          <Text style={{ color: theme.normal }}>{cacheSize == null ? t('setting_other_cache_getting') : t('setting_other_cache_size') + cacheSize}</Text>
        </View>
        <View style={styles.clearBtn}>
          <Button disabled={cleaning} onPress={handleCleanCache}>{t('setting_other_cache_clear_btn')}</Button>
        </View>
      </SubTitle>
    </>
  )
})

const styles = StyleSheet.create({
  cacheSize: {
    marginBottom: 5,
  },
  clearBtn: {
    flexDirection: 'row',
  },
})
