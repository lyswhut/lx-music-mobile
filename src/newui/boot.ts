/**
 * 新 UI 启动尾逻辑：只接回静默的深链监听（`initDeeplink`），
 * 旧启动流程里的提示弹窗 / 用户协议 / 更新检查一律不再调用。
 */
export const runNewUiBoot = async () => {
  const { initDeeplink } = await import('@/core/init/deeplink')
  void initDeeplink()
}
