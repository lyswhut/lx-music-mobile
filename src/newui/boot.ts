/**
 * 新 UI 启动尾逻辑（接线层，替代旧 handlePushedHomeScreen）。
 *
 * 用户要求：冷启动到新 UI 首页可见之间，不出现任何旧界面 / 旧弹窗。
 * 旧 `handlePushedHomeScreen`（src/core/init/index.ts）一次触发四个前置动作，
 * 本模块逐个处置如下（旧代码文件一律保留，只是不再被调用，可整体回滚）：
 *
 * 已断开（不再调用）：
 *  - cheatTip()          「谨防被骗提示」系统 Alert，首次启动必弹     → 跳过
 *  - showPactModal()     旧 UI 覆盖屏 PACT_MODAL（用户协议），未同意必弹 → 跳过
 *  - checkUpdate()       发现新版本时弹旧 UI 覆盖屏 VERSION_MODAL        → 跳过
 *                        （更新检查连带断掉；若需要静默检查再单独接回）
 *
 * 保留（静默任务，启动无感、无可见 UI）：
 *  - initDeeplink()      lxmusic:// 深链监听；仅在用户主动点链接时反应，
 *                        其处理动作会复用既有播放/歌单逻辑（非启动弹窗）。
 */
export const runNewUiBoot = async () => {
  const { initDeeplink } = await import('@/core/init/deeplink')
  void initDeeplink()
}
