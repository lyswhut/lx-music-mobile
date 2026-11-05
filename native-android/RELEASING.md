# 原生版本构建与分发

原生应用 ID 为 `cn.toside.music.nativeapp`，使用独立的 `native-vMAJOR.MINOR.PATCH` 更新通道。原 RN 安装包及其他包名、签名的 APK 无法作为此应用的更新安装。原版数据请通过歌单备份或同步服务转入。

## 本地构建

在本目录使用 JDK 17、Android SDK 36 和 Gradle Wrapper：

```powershell
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

默认调试版本为 `0.1.0`、versionCode `1`。可以通过 `-PnativeVersionName=0.1.1 -PnativeVersionCode=2` 构建升级测试包。测试包与正式包须保持各自的固定签名，正式分发勿使用调试密钥或验证目录内的临时密钥。

Release 签名从以下环境变量读取，四项需一起提供：

| 环境变量 | 用途 |
| --- | --- |
| `NATIVE_KEYSTORE_PATH` | 签名库的绝对路径 |
| `NATIVE_STORE_PASSWORD` | 签名库密码 |
| `NATIVE_KEY_ALIAS` | 密钥别名 |
| `NATIVE_KEY_PASSWORD` | 密钥密码 |

```powershell
.\gradlew.bat :app:assembleRelease :app:lintRelease -PnativeRequireSigning=true -PnativeVersionName=0.1.1 -PnativeVersionCode=1001
```

未配置签名时本地 Release 为未签名产物；`nativeRequireSigning=true` 会阻止此情况，始终不会自动改用调试签名。

## GitHub 发布草稿

`.github/workflows/native-release.yml` 只响应 `native-v*` 标签。配置仓库 Secrets `NATIVE_KEYSTORE_BASE64`（签名库 Base64）、`NATIVE_STORE_PASSWORD`、`NATIVE_KEY_ALIAS`、`NATIVE_KEY_PASSWORD` 后，由维护者推送标签触发。

工作流校验版本、运行单元测试和 Release Lint、构建并校验签名，生成 `lx-music-native-VERSION-universal.apk` 和 `SHA256SUMS.txt`，创建 GitHub Release **草稿**。维护者审核并发布后，应用才会识别。此次迁移仅写入工作流并在本地验证临时签名构建，没有推送标签或创建远程发布。

正式版 versionCode 固定按 `major * 1000000 + minor * 1000 + patch` 生成（major ≤ 2000，minor、patch ≤ 999，结果 > 0），已发布版本递增。例如 `native-v0.1.1` 对应 `1001`。

## 安装与测试

应用由 DownloadManager 下载更新，重建页面或退出应用后仍由系统调度。安装前会复制到私有目录，再检查大小、发布接口提供的 SHA-256、包名、版本名称、递增 versionCode 和兼容签名；最终安装需系统授权及确认。

Linux/CI 连接测试设备后可运行 `bash scripts/device-regression.sh`：自动准备正确/错误签名的升级测试包，推送至设备临时目录，使用正常基线版本运行设备回归。该脚本不操作系统安装确认界面。真实平台联网检查需额外显式传入 `liveProviders=true`；完整命令和验证范围见 [VALIDATION.md](VALIDATION.md)。
