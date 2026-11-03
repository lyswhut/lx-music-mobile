# com.salt.music（LX Music 二开版）同步与 OTA 说明

本分支 `jovi-dev` 基于上游 `lyswhut/lx-music-mobile` 的 `master`（v1.9.2）二开，目标：
1. 包名改为 `com.salt.music`；
2. 内置 **Jovi InCar 歌词** 能力（复用上游已内置的「显示蓝牙歌词」设置：把当前歌词行写入 MediaSession 的 TITLE，车机即可读取显示）；
3. 支持 **OTA 自升级**（应用内检测并下载安装新 APK）。

## 一、与上游同步（不覆盖二开）

```bash
# 首次：把你的 fork 设为 origin（把下面的地址换成你自己的 fork）
git remote add origin https://github.com/<YOUR_GITHUB_USER>/lx-music-mobile.git
git remote add upstream https://github.com/lyswhut/lx-music-mobile.git

# 日常同步上游更新
git fetch upstream
git checkout jovi-dev
git merge upstream/master      # 把上游最新改动合进二开分支
# 冲突通常只在 package.json 的 version/versionCode、或 src/config/constant.ts 的 OTA 地址等少数文件，
# 按需要保留本分支的修改即可。
git push origin jovi-dev
```

> 二开内容尽量集中在新文件（`src/utils/ota.ts`、`src/types/ota.d.ts`）与少量增量设置项，便于合并不冲突。

## 二、OTA 自升级

### 1. 修改配置（一次性）
- 编辑 `src/config/constant.ts` 的 `OTA_VERSION_URL`，把 `<YOUR_GITHUB_USER>` 换成你的 GitHub 用户名。
- 编辑 `.gitignore` 已包含 `*.jks` / `keystore.properties`，**私钥不会进版本库**。

### 2. 发布新版本
1. 改 `package.json`：
   - `version` 按 `1.9.2-salt.2`、`1.9.2-salt.3`… 递增（用 `salt.N` 区分补丁，便于 `compareVer` 比较）；
   - `versionCode` 递增（例如 `1000080`、`1000081`…），**必须 ≥ 已发布版本的 versionCode**，否则 Android 拒绝覆盖安装。
2. 用同一把 `android/my-release-key.jks` 打 release APK：
   ```bash
   cd android && ./gradlew assembleRelease
   ```
3. 在 GitHub 创建 Release（tag 如 `salt-v1.9.2.2`），上传 APK。
4. 把 `ota/update.json` 的 `version` / `apkUrl` / `changelog` 更新成新值，并放到可被 `OTA_VERSION_URL` 访问到的位置（推荐：仓库的 `salt-release` 分支根目录；或作为 Release 资源、或自建静态托管）。
   - 应用内已内置 raw + jsDelivr 双镜像容错。

### 3. 用户侧
- 应用启动会自动检查（可在「关于」里关闭「自动检查更新」），也可以手动在「关于 → 检查更新」触发；
- 检测到新版本会弹窗确认 → 下载 → 调用系统安装器安装（需用户授权「允许安装未知应用」）。

## 三、合规提醒
上游协议为 Apache-2.0（含补充条款）：非商业、仅供学习，要求不广泛分发、保留版权声明。
本二开版请**个人/私有**使用，不要公开大范围传播；OTA 也需要用户主动授权安装未知来源应用。
