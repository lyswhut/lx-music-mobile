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
 * 设定页（原型 #page-setting，index.html L245-253）：分组式设定页。
 * 骨架 = .set-hero 说明 + .set-group/.set-list/.set-row 行式家族（共通组件
 * SettingsGroup / SettingsRow），本轮只落三组：外观 → 数据与缓存 → 关于。
 * 原型的 播放 / 歌词 / 音源 三组这轮不做，也不留假行；今后加设定就是再插一组或几行，页面本身不改。
 *
 * 接线事实（只读复用，不改任何旧函数签名）：
 * - 外观三档走 @/newui/theme 的 useThemeMode（light / dark / system，本机持久化）
 * - 缓存大小 = 应用缓存 + 播放器音频缓存两处真实统计之和（旧 UI「资源缓存」同一口径）
 * - 清除范围 = 应用缓存 + 播放器缓存 + 歌曲地址记录；收藏、歌单、播放记录不受影响
 * - 「清除缓存」的确认载体是共通件 ConfirmSheet（原型 #confirmSheet 同族，QA 2026-10-14 第 13 轮
 *   换掉残留的系统 confirmDialog）：浮层本体挂在 MainScreen 根层（与其余浮层同一做法——
 *   本页在 PageViewport 的滚动内容里，自挂 absolute 浮层会错位），本页经 onRegisterClearCache
 *   把「真清除」动作注册上去，按「清除」由根层回调回来执行；清除逻辑本体一字未动
 * - 「清空播放记录」与首页/「我的」页同一份历史（useRecentPlays → utils/recentPlay，
 *   QA D-13 补行时不造第二份历史；原型 app.js L1329-1332 直接清空 + toast，无二次确认）
 * 2026-10-15（拆件转正轮）：`.set-hero` 原内联单元转正为独立组件 SetHero，渲染零变化、接线原样。
 */
export const SettingPage = memo(({ onOpenClearCacheConfirm, onRegisterClearCache }: NewUiPageProps) => {
  const { mode, setMode } = useThemeMode()

  // 右侧值恒定给一句人话状态：统计中 / 统计失败 / 真实大小 / 清除中
  const [cacheValue, setCacheValue] = useState<string>(L.cacheCounting)
  const clearingRef = useRef(false)

  // 播放记录计数（QA D-13）：订阅同一份自记历史，首页/「我的」页清过这里也跟着回零
  const recentPlays = useRecentPlays()

  const handleClearRecent = useCallback(() => {
    // 原型 clearRecent（app.js L283-289）直接清 + toast，不加二次确认（详情页 QA 已核实前提）；
    // clear 内部 notify()，useRecentPlays 订阅把本行与另两页一起刷正
    clearNewUiRecentPlays()
    showNewUiToast(NEW_UI_RECENT_CLEARED_TOAST)
  }, [])

  /**
   * 切外观档（QA D32）：原型 app.js L1396-1406 在 setTheme(mode) 之后固定补一句
   * `toast('外观 · ' + 档名)`——此前实现只切不报，反馈缺失，本轮按原型补齐。
   */
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

  /** 「清除缓存」行按下：只请求根层开确认浮层（原型 askClearCache → askConfirm 的两步之分） */
  const handleClearCache = useCallback(() => {
    onOpenClearCacheConfirm?.()
  }, [onOpenClearCacheConfirm])

  /** 确认浮层按「清除」后回来执行的真清除——逻辑与换载体前完全一致（clearingRef 防连点、
   * 三处缓存并清、成败各自反馈、收尾重统计），只是反馈 toast 换成 newui 自绘胶囊 */
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

  // 真清除动作注册给主屏根层的 ConfirmSheet（浮层在本页之外，动作留在本页面内）；
  // 卸载注销，避免根层持有着已过期的闭包
  useEffect(() => {
    onRegisterClearCache?.(runClearCache)
    return () => { onRegisterClearCache?.(null) }
  }, [onRegisterClearCache, runClearCache])

  return (
    <>
      <PageHeader title={L.pageTitle} />
      {/* .set-hero > .sh-sub：一句页面说明，「只改这台设备」的口径延续原型 */}
      <SetHero text={L.heroSub} />

      {/* 外观：三档模式三行，选中档用 .set-row.on 图标底回显 + .st-r.hi「在用」
          （原型家族自带 on / hi 两把状态笔，故不引入 Chip 分段，视觉零自创） */}
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

      {/* 数据与缓存：原型两行（app.js L1328-1333）——清除缓存 + 清空播放记录（QA D-13 补齐第二行） */}
      <SettingsGroup label={L.groupData}>
        <SettingsRow
          icon="list"
          title={L.clearCache}
          hint={L.clearCacheHint}
          value={cacheValue}
          onPress={handleClearCache}
        />
        {/* 原型 i-user 图标行；hint/value 按真实条数回显，清完两处（hint「N 条」→「已清空」右侧）自动跟上 */}
        <SettingsRow
          icon="user"
          title={L.clearRecent}
          hint={L.clearRecentHint(recentPlays.length)}
          value={recentPlays.length > 0 ? L.clearRecentCount(recentPlays.length) : L.clearRecentEmpty}
          onPress={handleClearRecent}
        />
      </SettingsGroup>

      {/* 关于：原型就一行（app.js L1335-1339 setInfo）——左侧品牌名，副行写清出处，
          右侧版本号（NEW_UI_APP_VERSION 读自 package.json 的 version，不手写第二份数字）；纯展示行不可点 */}
      <SettingsGroup label={L.groupAbout}>
        <SettingsRow
          icon="heart"
          title={`${NEW_UI_APP_NAME} · ${L.aboutBrandSub}`}
          hint={L.aboutOrigin}
          value={NEW_UI_APP_VERSION}
        />
      </SettingsGroup>
    </>
  )
})

SettingPage.displayName = 'NewUISettingPage'
