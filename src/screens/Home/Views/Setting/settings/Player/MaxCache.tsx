import { memo, useMemo } from 'react'

import SubTitle from '../../components/SubTitle'
import InputItem, { type InputItemProps } from '../../components/InputItem'
import { toast } from '@/utils/tools'
import { useSettingValue } from '@/store/setting/hook'
import { useI18n } from '@/lang'
import { updateSetting } from '@/core/common'

const MAX_SIZE = 1024 * 1024 * 1024
export default memo(() => {
  const t = useI18n()
  const cacheSize = useSettingValue('player.cacheSize')
  const setCacheSize = (size: string) => {
    updateSetting({ 'player.cacheSize': size })
  }

  const size = useMemo(() => {
    let size: number | string = parseInt(cacheSize)
    if (size == 0 || Number.isNaN(size)) size = ''
    return size.toString()
  }, [cacheSize])

  const setSize: InputItemProps['onChanged'] = (value, callback) => {
    let size: number | string = parseInt(value)
    if (Number.isNaN(size) || size < 0) size = ''
    else if (size > MAX_SIZE) size = MAX_SIZE
    size = size.toString()
    callback(size)
    if (cacheSize == size) return
    setCacheSize(size)
    toast(t('setting_play_cache_size_save_tip'))
  }

  return (
    <SubTitle title={t('setting_play_cache_size')}>
      <InputItem
        value={size}
        label=""
        onChanged={setSize}
        keyboardType="number-pad"
        placeholder={t('setting_play_cache_size_no_cache')} />
    </SubTitle>
  )
})

