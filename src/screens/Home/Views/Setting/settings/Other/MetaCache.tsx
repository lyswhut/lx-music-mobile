import React, { memo, useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

// import { gzip, ungzip } from 'pako'

import SubTitle from '../../components/SubTitle'
import Button from '../../components/Button'
import { toast } from '@/utils/tools'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { clearLyric, clearOtherSource, getMetaCache } from '@/utils/data'

export default memo(() => {
  const t = useI18n()
  const [otherSourceCleaning, setOtherSourceCleaning] = useState(false)
  const [lyricCleaning, setLyricCleaning] = useState(false)
  const [cacheInfo, setCacheInfo] = useState<{
    otherSourceKeys: null | string[]
    // musicUrlKeys: null | string[]
    lyricKeys: null | string[]
  }>({ otherSourceKeys: null, lyricKeys: null })

  const handleGetMetaCache = () => {
    void getMetaCache().then((info) => {
      setCacheInfo(info)
    })
  }

  const handleCleanOtherSourceCache = () => {
    if (cacheInfo.otherSourceKeys == null || !cacheInfo.otherSourceKeys.length) return
    setOtherSourceCleaning(true)
    clearOtherSource(cacheInfo.otherSourceKeys).then(() => {
      toast(t('setting_other_cache_clear_success_tip'))
    }).finally(() => {
      handleGetMetaCache()
      setOtherSourceCleaning(false)
    })
  }

  const handleCleanLyricKeysCache = () => {
    if (cacheInfo.lyricKeys == null || !cacheInfo.lyricKeys.length) return
    setLyricCleaning(true)
    clearLyric(cacheInfo.lyricKeys).then(() => {
      toast(t('setting_other_cache_clear_success_tip'))
    }).finally(() => {
      handleGetMetaCache()
      setLyricCleaning(false)
    })
  }


  useEffect(() => {
    handleGetMetaCache()
  }, [])

  return (
    <>
      <SubTitle title={t('setting__other_meta_cache')}>
        <View style={styles.cacheSize}>
          <Text>{cacheInfo.otherSourceKeys == null ? t('setting_other_cache_getting') : `${t('setting__other_other_source_label')}${cacheInfo.otherSourceKeys.length}`}</Text>
          {/* <Text>{cacheInfo.musicUrlKeys == null ? t('setting_other_cache_getting') : `${t('setting__other_music_url_label')}${cacheInfo.musicUrlKeys.length}`}</Text> */}
          <Text>{cacheInfo.lyricKeys == null ? t('setting_other_cache_getting') : `${t('setting__other_lyric_raw_label')}${cacheInfo.lyricKeys.length}`}</Text>
        </View>
        <View style={styles.clearBtn}>
          <Button disabled={otherSourceCleaning} onPress={handleCleanOtherSourceCache}>{t('setting__other_other_source_clear_btn')}</Button>
          {/* <Button disabled={cleaning} onPress={handleCleanMusicUrlCache}>{t('setting__other_music_url_clear_btn')}</Button> */}
          <Button disabled={lyricCleaning} onPress={handleCleanLyricKeysCache}>{t('setting__other_lyric_raw_clear_btn')}</Button>
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
