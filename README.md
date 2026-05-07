<p align="center"><a href="https://github.com/lyswhut/lx-music-mobile"><img width="200" src="https://github.com/lyswhut/lx-music-mobile/blob/master/doc/images/icon.png" alt="lx-music logo"></a></p>

<h1 align="center">LX Music 移动版</h1>

<p align="center">
  <a href="https://github.com/lyswhut/lx-music-mobile/releases"><img src="https://img.shields.io/github/release/lyswhut/lx-music-mobile" alt="Release version"></a>
  <a href="https://github.com/lyswhut/lx-music-mobile/actions/workflows/release.yml"><img src="https://github.com/lyswhut/lx-music-mobile/workflows/Build/badge.svg" alt="Build status"></a>
  <a href="https://github.com/lyswhut/lx-music-mobile/actions/workflows/beta-pack.yml"><img src="https://github.com/lyswhut/lx-music-mobile/workflows/Build%20Beta/badge.svg" alt="Build status"></a>
  <a href="https://github.com/facebook/react-native"><img src="https://img.shields.io/github/package-json/dependency-version/lyswhut/lx-music-mobile/react-native/master" alt="React native version"></a>
  <!-- <a href="https://github.com/lyswhut/lx-music-mobile/releases"><img src="https://img.shields.io/github/downloads/lyswhut/lx-music-mobile/latest/total" alt="Downloads"></a> -->
  <a href="https://github.com/lyswhut/lx-music-mobile/tree/dev"><img src="https://img.shields.io/github/package-json/v/lyswhut/lx-music-mobile/dev" alt="Dev branch version"></a>
  <!-- <a href="https://github.com/lyswhut/lx-music-mobile/blob/master/LICENSE"><img src="https://img.shields.io/github/license/lyswhut/lx-music-mobile" alt="License"></a> -->
</p>

<p align="center">一个基于 React Native 开发的音乐软件</p>

## 关于本仓库（Pride-lee / [lx-music-mobile](https://github.com/Pride-lee/lx-music-mobile)）

本仓库在 **[lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile)** 上游基础上，合并他人分支后做了功能与体验向的修改。**Release 与 Issue 请以本仓库为准**；上游更新可通过 `git remote add upstream …` 后自行 `fetch` / `merge`。

### 相对上游的主要改动

| 模块 | 说明 |
|------|------|
| **底部导航** | 新增 `BottomBar`（`src/screens/Home/components/BottomBar.tsx`），横版 / 竖版首页接入；`LIST_IDS` 增加 `download` 页签（`src/config/constant.ts`）。 |
| **下载到本地** | 在线列表、我的歌单列表菜单支持下载（`OnlineList`、`Mylist/MusicList` 的 `ListMenu` / `listAction`）。核心逻辑在 `src/core/music/downloader.ts`。 |
| **保存路径（Android）** | 使用系统公共目录 **`Download/lxmusic`**（`src/utils/fs.ts` 中 `getMusicDownloadDirectoryPath` / `ensureMusicDownloadDirectory`），便于在系统文件管理器的「下载」里找到；iOS 为应用沙盒 `Documents/download/lxmusic`。下载完成后 Android 会 `scanFile` 便于媒体库识别。 |
| **存储权限** | Android 在写入公共下载目录前调用 `requestStoragePermission`（`src/utils/tools.ts`，非 Android 直接视为已授权）；拒绝或「不再询问」时 Toast / 弹窗引导前往系统设置（多语言文案见 `src/lang/*.json`）。 |
| **下载音质与 CDN** | 下载取链音质与 **设置 → 播放音质** 一致（`getPlayQuality` + `getMusicUrl`）；下载请求附带各音源常见 **`Referer`**，减轻高码率直链 403。默认示例配置里 `player.playQuality` 为 `320k`（`src/config/defaultSetting.ts`，可按需调整）。 |
| **下载页** | `src/screens/Home/Views/Download/index.js`：展示本地下载列表、刷新等。 |
| **界面** | `PlayerBar` 等样式调整；`PactModal` 等小改动。 |
| **Android 工程** | `android/build.gradle`、`gradle.properties`、`gradle-wrapper.properties` 等为本地可打包环境调整（若你环境不同请自行对齐）。 |

### 同步上游示例

```bash
git fetch upstream
git merge upstream/master   # 或 git rebase upstream/master
```

### 自动同步上游 + 自动打包到 Release

仓库已附带两个工作流，配合一次性配置即可让「同步上游」与「打包发版」全自动跑：

- `.github/workflows/sync-upstream.yml`：每天 UTC 18:00（北京 02:00）自动 `merge upstream/master` 并推送，可在 Actions 页手动触发。
- `.github/workflows/release.yml`：`push master` 或手动 `workflow_dispatch` 时构建多架构 APK 并发到 [Releases](https://github.com/Pride-lee/lx-music-mobile/releases)。

#### 一次性需要在 GitHub 配置的 Secrets

在仓库 **Settings → Secrets and variables → Actions → New repository secret** 添加：

| Secret | 用途 | 是否必需 |
|--------|------|----------|
| `KEYSTORE_STORE_FILE_BASE64` | Android 签名 keystore 的 **base64**（`base64 -w0 your.keystore`） | 必需 |
| `KEYSTORE_STORE_FILE` | keystore 文件名（构建时落到 `android/app/<这个名字>`） | 必需 |
| `KEYSTORE_KEY_ALIAS` | keystore 的 key alias | 必需 |
| `KEYSTORE_PASSWORD` | keystore 密码 | 必需 |
| `KEYSTORE_KEY_PASSWORD` | key 密码 | 必需 |
| `SYNC_TOKEN` | 一个 **Fine-grained PAT**，对本仓库给 **Contents: Read and write** + **Actions: Read and write**；用来让自动同步推送的提交能触发后续 workflow | 可选，强烈建议 |

> 不配置 `SYNC_TOKEN` 也能跑：默认会退化为 `GITHUB_TOKEN` 推送，并显式调用 `release.yml` 的 `workflow_dispatch` 兜底；但 PAT 模式更稳，且能让 release.yml 通过 `push` 事件自然触发。

#### 触发方式

- **自动**：每天定时；如上游有更新，工作流会合并、推送并自动调起 Release 打包。
- **手动**：到 **Actions → Sync Upstream → Run workflow**，可选输入 `upstream_branch`（默认 `master`）和是否同时跑 Release。
- **直接发版**：到 **Actions → Build → Run workflow**，无需同步即可基于当前 master 重新打包发布。

#### 版本号说明

`release.yml` 使用 `package.json` 中的 `version` 作为 tag（前缀 `v`）。同步上游若未修改 `version`，tag 已存在时 `pkgdeps/git-tag-action` 不会重复创建；若希望每次同步都发新 release，可在合并完手动 bump 一下 `package.json` 的 version 再 push。

---

## 说明

所用技术栈：

- React Native
- Redux

已支持的平台：

- Android 5 及以上

***注：目前没有计划支持 iOS 和 HarmonyOS NEXT**。*<br>
*桌面版项目地址：<https://github.com/lyswhut/lx-music-desktop>*<br>
*LX Music 项目发展调整与新项目计划：https://github.com/lyswhut/lx-music-desktop/issues/1912*

软件变化请查看[更新日志](https://github.com/lyswhut/lx-music-mobile/blob/master/CHANGELOG.md)。

软件下载请查看 [GitHub Releases](https://github.com/lyswhut/lx-music-mobile/releases)。

使用常见问题请参阅[移动版常见问题](https://lyswhut.github.io/lx-music-doc/mobile/faq)。

目前本项目的原始发布地址只有 [**GitHub**](https://github.com/lyswhut/lx-music-mobile/releases)，其他渠道均为第三方转载发布，与本项目无关！

为了提高使用门槛，本软件内的默认设置、UI 操作不以新手友好为目标，所以使用前建议先根据你的喜好浏览调整一遍软件设置，阅读一遍[音乐播放列表机制](https://lyswhut.github.io/lx-music-doc/mobile/faq/playlist)。

### 数据同步服务

从 v1.0.0 起，我们发布了一个独立的[数据同步服务](https://github.com/lyswhut/lx-music-sync-server#readme)。如果你有服务器，可以将其部署到服务器上作为私人多端同步服务使用，详情看该项目说明。

## 贡献代码

本项目欢迎 PR，但为了 PR 能顺利合并，需要注意以下几点：

- 对于添加新功能的 PR，建议在提交 PR 前先创建 Issue 进行说明，以确认该功能是否确实需要；
- 对于修复 bug 的 PR，请提供修复前后的说明及重现方式；
- 对于其他类型的 PR，则适当附上说明。

贡献代码步骤：

1. 参照[源码使用方法](https://lyswhut.github.io/lx-music-doc/mobile/use-source-code)设置开发环境；
2. 克隆本仓库代码并切换至 `dev` 分支进行开发；
3. 提交 PR 至 `dev` 分支。

<!--
## 用户界面

<p><img width="100%" src="https://github.com/lyswhut/lx-music-mobile/blob/master/doc/images/app.png" alt="lx-music mobile UI"></p> -->

## 项目协议

本项目基于 [Apache License 2.0](https://github.com/lyswhut/lx-music-mobile/blob/master/LICENSE) 许可证发行，以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。

---

*词语约定：本协议中的“本项目”指 LX Music（洛雪音乐）移动版项目；“使用者”指签署本协议的使用者；“官方音乐平台”指对本项目内置的包括酷我、酷狗、咪咕等音乐源的官方平台统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。*

### 一、数据来源

1.1 本项目的各官方平台在线数据来源原理是从其公开服务器中拉取数据（与未登录状态在官方平台 APP 获取的数据相同），经过对数据简单地筛选与合并后进行展示，因此本项目不对数据的合法性、准确性负责。

1.2 本项目本身没有获取某个音频数据的能力，本项目使用的在线音频数据来源来自软件设置内“自定义源”设置所选择的“源”返回的在线链接。例如播放某首歌，本项目所做的只是将希望播放的歌曲名、艺术家等信息传递给“源”，若“源”返回了一个链接，则本项目将认为这就是该歌曲的音频数据而进行使用，至于这是不是正确的音频数据本项目无法校验其准确性，所以使用本项目的过程中可能会出现希望播放的音频与实际播放的音频不对应或者无法播放的问题。

1.3 本项目的非官方平台数据（例如“我的列表”内列表）来自使用者本地系统或者使用者连接的同步服务，本项目不对这些数据的合法性、准确性负责。

### 二、版权数据

2.1 使用本项目的过程中可能会产生版权数据。对于这些版权数据，本项目不拥有它们的所有权。为了避免侵权，使用者务必在 **24 小时内** 清除使用本项目的过程中所产生的版权数据。

### 三、音乐平台别名

3.1 本项目内的官方音乐平台别名为本项目内对官方音乐平台的一个称呼，不包含恶意。如果官方音乐平台觉得不妥，可联系本项目更改或移除。

### 四、资源使用

4.1 本项目内使用的部分包括但不限于字体、图片等资源来源于互联网。如果出现侵权可联系本项目移除。

### 五、免责声明

5.1 由于使用本项目产生的包括由于本协议或由于使用或无法使用本项目而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。

### 六、使用限制

6.1 本项目完全免费，且开源发布于 GitHub 面向全世界人用作对技术的学习交流。本项目不对项目内的技术可能存在违反当地法律法规的行为作保证。

6.2 **禁止在违反当地法律法规的情况下使用本项目。** 对于使用者在明知或不知当地法律法规不允许的情况下使用本项目所造成的任何违法违规行为由使用者承担，本项目不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。

### 七、版权保护

7.1 音乐平台不易，请尊重版权，支持正版。

### 八、非商业性质

8.1 本项目仅用于对技术可行性的探索及研究，不接受任何商业（包括但不限于广告等）合作及捐赠。

### 九、接受协议

9.1 若你使用了本项目，即代表你接受本协议。

---

若对此有疑问请 mail to: lyswhut+qq.com (请将 `+` 替换成 `@`)
