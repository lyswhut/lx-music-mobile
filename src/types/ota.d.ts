export interface OtaInfo {
  /** 新版本号，使用 compareVer 与本地版本比较，例如 "1.9.2-salt.1" */
  version: string
  /** 新版本 APK 直链（GitHub Releases / 自建静态托管均可） */
  apkUrl: string
  /** 更新日志 / 提示文案 */
  changelog?: string
  /** 是否强制更新（预留，当前实现不强制） */
  force?: boolean
}
