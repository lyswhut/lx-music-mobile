# 原生迁移验证记录

日期：2026-11-04。设备：YYA-H618，Android 12（API 31）。JDK 17，Gradle 8.13，Android SDK 36。

## 实际执行结果

| 验证 | 结果 |
| --- | --- |
| JVM 单元测试 | 14 项通过 |
| 全量设备回归 | 145 项通过，0 失败、0 跳过（显式启用了联网及升级包测试） |
| 五平台联网检查 | 5 个平台，每平台 12 个分项，共 60 个分项通过，已计入上述设备回归 |
| Debug Lint | 最终复验 0 错误、58 警告（全量回归时另含依赖新版本等提示，共 62 警告、1 提示） |
| Release Lint | 0 错误、58 警告 |
| APK 构建 | Debug、测试 APK、临时密钥签名 Release 构建成功，apksigner 验证通过 |
| 系统覆盖升级 | 独立原生包 0.1.0/code 1 → 同签名 0.1.1/code 2，私有目录测试数据保留，随后卸载临时测试安装 |
| RN 删除后复验 | app:clean 后仅使用本工程 Gradle Wrapper，从空输出重新构建；14 项单元测试及后台同步/歌曲信息编辑/更新共 11 项设备测试通过 |

Lint 警告包括依赖新版本提示、RTL、可访问性、原平台协议所需加密方式及复数资源建议等；未通过禁用 Lint 掩盖错误。后续追加长歌词编辑/重建/保存修复，避免截断或将大文本放入 Activity 状态事务；相关 5 项歌曲编辑测试再次全部通过，其 XML 随专项报告归档。

## 覆盖内容

- 原生后台歌单/不喜欢同步、独立冲突、断网重试、跨存储实例变更、持久化发送队列、远程操作不回发、服务恢复、通知断开及显式退出。使用本地授权与真实 WebSocket/RPC 对等端，验证 Home 后、Activity 销毁及重建后的双向同步。
- 队列编辑/保存、历史、启动偏好、倍速和音量、暂停保持/跳转、定时停止、媒体会话及通知；使用静音 PCM/本地 HTTP，验证 MediaPlayer 和 Media3；系统媒体进程失败后回退 Media3。
- Media3 上游不可达时读取缓存、动态 LRU、音源停用且播放服务重建后的完整缓存离线重播、后台封面加载。
- KRC/QRC/YRC/MRC、扩展歌词、逐字时间、逐曲微调、缓存、导入、内嵌歌词、简繁转换及桌面歌词设置。
- 多音源导入/选择/删除/更新提示、网络/二进制/multipart/取消/加密桥接，本地歌词/封面动作，换源匹配与并发缓存、失败隔离。
- 歌单元数据、批量/区间操作、排序/移动及同步协议回放；旧版备份与 allData 列表范围、按 ID 恢复；私有音频内容去重/元数据及无媒体库权限的恢复。
- 本地 WAV 名称/歌手/专辑/封面/LRC 写入、读取与删除，原 PCM 字节保留，错误图片拒绝，MediaStore 文件描述符写入，原生编辑页面重建；修改在各歌单、备份和同步中一致。
- 五平台搜索、第二页、建议、热搜、热门/最新评论、歌词、推荐歌单/详情、歌单搜索、排行榜和分类。修复网易旧热搜及分页大小、咪咕建议返回网页的问题。
- 外部 VIEW/SEND、LX 深链/控制/searchPlay、脚本/备份导入、分享；酷狗特殊链接响应与原 H5 签名输出，网易私有歌单凭据独立加密及清除。
- 首启协议/倒计时/拒绝/延迟服务与深链；语言/字号/主题切换保留播放、当前页面和滚动位置；简体/繁体/英文资源与格式占位符；窗口 Insets/横向手势/导航及退出；诊断日志有界、顺序、脱敏。
- 更新通道过滤，真实 DownloadManager 后台下载和状态重建；APK 私有副本、完整性、大小、签名、版本/包名拒绝及 FileProvider 只读安装 URI。没有自动点击系统安装确认；另用 Android 包管理器验证真实同签名覆盖安装与数据保留。

## 复现

在仓库根目录，连接 Android 测试设备：

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug :app:assembleDebugAndroidTest :app:lintDebug
.\gradlew.bat :app:connectedDebugAndroidTest
```

默认设备测试有 7 项需要显式参数：5 项真实平台联网、2 项升级 APK/错误签名完整检查。未传参数时按设计跳过，不能将默认结果写成 145 项全部通过。

完整回归先准备同一调试签名的 0.1.1/code 2 APK，以及版本/包名相同但签名不同的测试 APK，推送到设备临时目录，然后用默认 0.1.0/code 1 运行：

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:connectedDebugAndroidTest `
  '-Pandroid.testInstrumentationRunnerArguments.liveProviders=true' `
  '-Pandroid.testInstrumentationRunnerArguments.updateFixture=/data/local/tmp/lx-native-update-fixture.apk' `
  '-Pandroid.testInstrumentationRunnerArguments.wrongSignerFixture=/data/local/tmp/lx-native-wrong-signer.apk' `
  '-Pandroid.testInstrumentationRunnerArguments.migrationScreenshots=true'
```

Linux/CI 可用 `bash scripts/device-regression.sh` 自动准备测试 APK 并运行不含真实平台联网的回归。单独启用联网检查可传 `class=cn.toside.music.nativeapp.online.ProviderSmokeTest` 和 `liveProviders=true`。脚本不会发布或自动确认安装。

## 报告和边界

原始全量 XML、专项报告、Lint、签名构建、覆盖升级结果和四张英文/繁体界面截图归档在 `app/build/reports/migration-validation/`；清理输出前另保存于 `build/migration-validation/before-clean/`。这些目录是忽略的本地构建产物，不入 Git。

本次没有解析或下载真实音乐音频。真实 DSP 卸载、蓝牙终端、其他系统/设备/音频格式、所有第三方脚本、真实私有或过期分享仍需对应样本覆盖。系统同步超时回调在 Android 12 模拟调用，未在 Android 15 真机运行到时限。

API 28/35 模拟器回归、签名及原生发布草稿工作流已写入，但没有在远程执行，也没有推送、打标签或发布版本。RN 源码与工具链已在全量回归通过后移除，删除后完成独立构建与关键功能复验。

## 分包重构验证（2026-11-05）

源码及测试按 `ui`、`utils`、`data`、`player`、`lyrics`、`online`、`source`、`sync`、`update` 职责分包，同时更新 Manifest 组件路径和跨包引用。版本查询与发布模型从“关于”对话框提取到 `update/NativeReleases.kt`。逐文件比对确认原有 134 个 Kotlin 文件的业务及测试代码、提取的版本查询逻辑保持一致。

| 验证 | 本轮结果 |
| --- | --- |
| Debug APK 和仪器测试 APK 构建 | 通过 |
| JVM 单元测试 | 14 项通过，0 失败 |
| Debug Lint | 0 错误、58 警告 |
| Android 12 定向设备回归（YYA-H618） | 29 项通过，0 失败、0 跳过 |

设备回归范围为 `cn.toside.music.nativeapp` 下的 `ui.HomeNavigationTest`、`ui.PlayerDetailTest`、`ui.AboutDiagnosticsTest`、`data.LocalMetadataTest`、`player.PlaybackSettingsTest`、`sync.SyncServiceTest`，覆盖导航、关于与版本查询、日志、元数据编辑、播放与界面重建、后台同步服务等入口。

## 工程根目录调整验证（2026-11-05）

Android 工程已移至仓库根目录，`app/`、`gradle/`、`scripts/`、Gradle 配置与 Wrapper 可直接使用；CI 的触发路径、构建目录、设备回归入口、产物归档及发布草稿报告路径已同步更新。详细使用与开发说明位于 [DEVELOPMENT.md](DEVELOPMENT.md)。迁移的 197 个源码、资源、构建及脚本文件与 Git 中的原文件逐字节一致，文档中的本地链接检查通过。

在仓库根目录执行 `:app:assembleDebug :app:assembleDebugAndroidTest :app:testDebugUnitTest :app:lintDebug` 全部通过；JVM 单元测试 14 项通过，Lint 为 0 错误、58 警告。设备回归脚本和 Unix Gradle Wrapper 均通过 `bash -n` 语法检查。
