import { memo, useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

// import { gzip, ungzip } from 'pako'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { toast, resetNotificationPermissionCheck, confirmDialog, resetIgnoringBatteryOptimizationCheck } from '@/utils/tools'
import { getAppCacheSize, clearAppCache } from '@/utils/nativeModules/cache'
import { getCacheSize, clearCache } from '@/plugins/player/utils'
import { sizeFormate } from '@/utils'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { clearMusicUrl } from '@/utils/data'

export default memo(() => {
  const t = useI18n()
  const [cleaning, setCleaning] = useState(false)
  const [cacheSize, setCacheSize] = useState<string | null>(null)
  // const setting = useGetter('common', 'setting')
  // TODO clear list cache
  // const clearCache = useDispatch('list', 'clearCache')

  const handleGetAppCacheSize = () => {
    void Promise.all([getAppCacheSize(), getCacheSize()]).then(([size, size2]) => {
      const count = size + size2
      setCacheSize(sizeFormate(count))
    })
  }

  const handleCleanCache = () => {
    if (cacheSize == null) return
    void confirmDialog({
      message: t('confirm_tip'),
      confirmButtonText: t('list_remove_tip_button'),
    }).then(confirm => {
      if (!confirm) return
      setCleaning(true)
      void Promise.all([
        clearAppCache(),
        clearCache(),
        clearMusicUrl(),
        resetNotificationPermissionCheck(),
        resetIgnoringBatteryOptimizationCheck(),
      ]).then(() => {
        toast(t('setting_other_cache_clear_success_tip'))
      }).finally(() => {
        handleGetAppCacheSize()
        setCleaning(false)
      })
    })
  }


  useEffect(() => {
    handleGetAppCacheSize()
  }, [])

  return (
    <>
      <SubTitle title={t('setting__other_resource_cache')}>
        <View style={styles.cacheSize}>
          <Text>{cacheSize == null ? t('setting_other_cache_getting') : t('setting_other_cache_size') + cacheSize}</Text>
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
