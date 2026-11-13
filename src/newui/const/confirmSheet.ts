/**
 * 二次确认浮层（原型 #confirmSheet，index.html L498-509；askConfirm，app.js L1400-1408）
 * 的兜底文案。正文/标题/键名各调用点自带（见 const/mine.ts、const/songlistDetail.ts），
 * 这里只放原型 askConfirm 形参默认值那三个通用键。
 */
export const NEW_UI_SHEET_CONFIRM = {
  /** title 默认值（app.js L1400 `title = '要执行这一步吗'`） */
  defaultTitle: '要执行这一步吗',
  /** 左键（index.html L503 写死的「取消」） */
  cancel: '取消',
  /** okLabel 默认值（app.js L1400 `okLabel = '确定'`） */
  ok: '确定',
} as const
