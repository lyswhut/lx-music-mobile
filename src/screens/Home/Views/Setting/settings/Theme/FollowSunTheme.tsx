import { memo, useEffect, useState } from 'react'
import { View } from 'react-native'

import CheckBoxItem from '../../components/CheckBoxItem'
import Text from '@/components/common/Text'
import { createStyle } from '@/utils/tools'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { updateSetting } from '@/core/common'
import { useSettingValue } from '@/store/setting/hook'
import { refreshSunTheme } from '@/core/init/sunTheme'
import { sunState } from '@/utils/sunState'
import { DEFAULT_SUN_LOCATION, ensureSunLocation, onSunLocationChange, sunLocationState, sunPoint } from '@/utils/sunLocation'
import { nearestSwitch } from '@/utils/sunrise'

const two = (n: number) => String(n).padStart(2, '0')
// 切换点写成「7:00日出」这样（小时不补零）
const hourText = (d: Date) => `${d.getHours()}:${two(d.getMinutes())}`

export default memo(() => {
  const t = useI18n()
  const theme = useTheme()
  const isOn = useSettingValue('common.followSunTheme')
  const [, setRevision] = useState(0)

  useEffect(() => {
    // 打开设置页就顺手补一次定位，但前提是已经连着车机（sunState.enabled 里含这个条件）；
    // 没连车机时这一页不该产生任何网络请求
    if (sunState.enabled) void ensureSunLocation()
    const offLocation = onSunLocationChange(() => { setRevision(v => v + 1) })
    // 这一行显示的是「离得最近的切换点」，过了日出/日落要能自己换过来。
    // 一分钟一次的成本可以忽略：定时器只在这一页开着时存在，每跳只是两次纯数学运算
    // 加这一行文字重绘，不联网、不读文件、不调原生
    const timer = setInterval(() => { setRevision(v => v + 1) }, 60 * 1000)
    return () => {
      offLocation()
      clearInterval(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setIsOn = (isOn: boolean) => {
    // 和「跟随系统亮、暗模式切换主题」可以同时勾：两边是「或」的关系，
    // 任一判定该深色就变深色，两个都没到条件就不动（见 getTheme()）
    updateSetting({ 'common.followSunTheme': isOn })
    void refreshSunTheme(isOn)
  }

  const location = sunLocationState.location
  const error = sunLocationState.error
  const located = location.ts > 0
  // 有的服务不给城市名（geojs 常缺），这时退回显示经纬度，别让状态行出现空字段
  const placeOf = (city: string, lat: number, lng: number) => city || `${lat.toFixed(2)}, ${lng.toFixed(2)}`
  const place = located
    ? placeOf(location.city, location.lat, location.lng)
    : placeOf(DEFAULT_SUN_LOCATION.city, DEFAULT_SUN_LOCATION.lat, DEFAULT_SUN_LOCATION.lng)
  const nearest = nearestSwitch(new Date(), sunPoint())
  // 三种状态都用同一句式「IP 城市 · 时间 日出/日落 · 状态」，所以时间一律算出来：
  // 从没定位成功过时按内置默认坐标算，最近一次刷新失败时按上次定位到的城市算
  const clock = nearest ? hourText(nearest.at) : '？'
  const event = nearest ? t(nearest.isSunrise ? 'setting_basic_theme_sun_rise' : 'setting_basic_theme_sun_set') : ''
  let tip
  if (!located) {
    // 从没定位成功过：这次查了没查到 = 定位失败；还没轮到查（没连车机）= 用的就是内置默认坐标
    tip = error
      ? t('setting_basic_theme_sun_loc_failed', { place, time: clock, event })
      : t('setting_basic_theme_sun_loc_default', { place, time: clock, event })
  } else if (error) {
    // 定位过、这次连上车机没刷新成功：城市和时间是上次留下的
    tip = t('setting_basic_theme_sun_loc_stale', { place, time: clock, event })
  } else if (!nearest) {
    // 极圈附近算不出升落（中国境内不会遇到），时间那格换成「极圈地区」，不说假话
    tip = t('setting_basic_theme_sun_loc_polar', { place })
  } else {
    // 参数一律显式传（不用展开写法），否则 check_lang_params.py 读不出占位符对应关系
    tip = t('setting_basic_theme_sun_loc_info', { place, time: clock, event })
  }

  return (
    <View style={styles.content}>
      <CheckBoxItem check={isOn} label={t('setting_basic_theme_follow_sun')} onChange={setIsOn} />
      <View style={styles.tipRow}>
        <Text size={12} color={theme['c-font-label']} style={styles.tip}>{tip}</Text>
      </View>
    </View>
  )
})

const styles = createStyle({
  content: {
    marginTop: 5,
  },
  tipRow: {
    flexDirection: 'row',
    paddingLeft: 25,
    paddingRight: 25,
  },
  tip: {
    lineHeight: 17,
  },
})
