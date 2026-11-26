import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { PageHeader, SetHero, SettingsGroup, SettingsRow } from '@/newui/components'
import { NEW_UI_APP_NAME, NEW_UI_APP_VERSION, NEW_UI_RECENT_CLEARED_TOAST, NEW_UI_SETTING_LABELS } from '@/newui/const'
import { useRecentPlays } from '@/newui/hooks'
import { useThemeMode, type ThemeMode } from '@/newui/theme'
import { clearNewUiRecentPlays, showNewUiToast } from '@/newui/utils'
import { clearCache, getCacheSize } from '@/plugins/player/utils'
import { sizeFormate } from '@/utils'
import { clearAppCache, getAppCacheSize } from '@/utils/nativeModules/cache'
import { clearMusicUrl } from '@/utils/data'

import type { NewUiPageProps } from '../../types'

const L = NEW_UI_SETTING_LABELS

/**
 * 设定页：分组式设定页（外观 / 数据与缓存 / 关于）。
 * 外观走 useThemeMode；缓存大小 = 应用缓存 + 播放器音频缓存；
 * 清除范围含应用缓存 / 播放器缓存 / 歌曲地址记录，不动收藏、歌单与播放记录。
 * 清除缓存经 ConfirmSheet 二次确认（浮层挂在 MainScreen 根层，本页经 onRegisterClearCache 注册真清除动作）。
 */
export const SettingPage = memo(({ onOpenClearCacheConfirm, onRegisterClearCache }: NewUiPageProps) => {
  const { mode, setMode } = useThemeMode()

  // 右侧值恒定给一句人话状态：统计中 / 统计失败 / 真实大小 / 清除中
  const [cacheValue, setCacheValue] = useState<string>(L.cacheCounting)
  const clearingRef = useRef(false)

  // 播放记录计数：订阅同一份自记历史，其它页清过这里跟着回零
  const recentPlays = useRecentPlays()

  const handleClearRecent = useCallback(() => {
    // 直接清 + toast，不加二次确认；clear 内部 notify()，三页订阅一起刷新
    clearNewUiRecentPlays()
    showNewUiToast(NEW_UI_RECENT_CLEARED_TOAST)
  }, [])

  /** 切外观档：setMode 后补一句档名 toast */
  const handleAppearancePress = useCallback((next: ThemeMode, label: string) => {
    setMode(next)
    showNewUiToast(L.appearanceToast(label))
  }, [setMode])

  const recountCache = useCallback(() => {
    setCacheValue(L.cacheCounting)
    void Promise.all([getAppCacheSize(), getCacheSize()])
      .then(([appSize, playSize]) => setCacheValue(sizeFormate(appSize + playSize)))
      .catch(() => setCacheValue(L.cacheFailed))
  }, [])

  useEffect(() => {
    recountCache()
  }, [recountCache])

  /** 「清除缓存」行按下：只请求根层开确认浮层 */
  const handleClearCache = useCallback(() => {
    onOpenClearCacheConfirm?.()
  }, [onOpenClearCacheConfirm])

  /** 真清除：clearingRef 防连点，三处缓存并清，成败各自 toast，收尾重统计 */
  const runClearCache = useCallback(() => {
    if (clearingRef.current) return
    clearingRef.current = true
    setCacheValue(L.cacheClearing)
    void (async () => {
      try {
        await Promise.all([clearAppCache(), clearCache(), clearMusicUrl()])
        showNewUiToast(L.clearDoneToast)
      } catch {
        showNewUiToast(L.clearFailToast)
      } finally {
        clearingRef.current = false
        recountCache()
      }
    })()
  }, [recountCache])

  // 真清除动作注册给根层 ConfirmSheet；卸载注销，避免持有过期闭包
  useEffect(() => {
    onRegisterClearCache?.(runClearCache)
    return () => { onRegisterClearCache?.(null) }
  }, [onRegisterClearCache, runClearCache])

  return (
    <>
      <PageHeader title={L.pageTitle} />
      {/* 页面说明：口径是「只改这台设备」 */}
      <SetHero text={L.heroSub} />

      {/* 外观：三档三行，选中档用图标底回显 + 「在用」，不引入 Chip 分段 */}
      <SettingsGroup label={L.groupAppearance}>
        <SettingsRow
          icon="sun"
          title={L.appearanceLight}
          hint={L.appearanceLightHint}
          selected={mode === 'light'}
          value={mode === 'light' ? L.appearanceActive : undefined}
          valueHighlight={mode === 'light'}
          onPress={() => handleAppearancePress('light', L.appearanceLight)}
        />
        <SettingsRow
          icon="moon"
          title={L.appearanceDark}
          hint={L.appearanceDarkHint}
          selected={mode === 'dark'}
          value={mode === 'dark' ? L.appearanceActive : undefined}
          valueHighlight={mode === 'dark'}
          onPress={() => handleAppearancePress('dark', L.appearanceDark)}
        />
        <SettingsRow
          icon="phone"
          title={L.appearanceSystem}
          hint={L.appearanceSystemHint}
          selected={mode === 'system'}
          value={mode === 'system' ? L.appearanceActive : undefined}
          valueHighlight={mode === 'system'}
          onPress={() => handleAppearancePress('system', L.appearanceSystem)}
        />
      </SettingsGroup>

      {/* 数据与缓存：清除缓存 + 清空播放记录 */}
      <SettingsGroup label={L.groupData}>
        <SettingsRow
          icon="list"
          title={L.clearCache}
          hint={L.clearCacheHint}
          value={cacheValue}
          onPress={handleClearCache}
        />
        {/* hint / value 按真实条数回显，清空后自动跟上 */}
        <SettingsRow
          icon="user"
          title={L.clearRecent}
          hint={L.clearRecentHint(recentPlays.length)}
          value={recentPlays.length > 0 ? L.clearRecentCount(recentPlays.length) : L.clearRecentEmpty}
          onPress={handleClearRecent}
        />
      </SettingsGroup>

      {/* 关于：品牌名 + 出处 + 版本号（读自 package.json，不手写）；纯展示不可点 */}
      <SettingsGroup label={L.groupAbout}>
        <SettingsRow
          icon="heart"
          title={NEW_UI_APP_NAME}
          hint={L.aboutOrigin}
          value={NEW_UI_APP_VERSION}
        />
      </SettingsGroup>
    </>
  )
})

SettingPage.displayName = 'NewUISettingPage'
