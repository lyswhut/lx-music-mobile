# CarWith / Jovi InCar 适配说明（供上游审阅）

## 1. 基线与改动范围

- 上游仓库：`lyswhut/lx-music-mobile`
- 基线标签：`v1.9.2`
- 基线提交：`0669d1b6d419967822ff52ec06e50b9613bfd136`
- 源码改动：22 个 `src/` 文件，其中修改 15 个、新增 7 个；上传补丁原始统计为 `+788 / -8`
- 同步时修复了新增代码的 12 个 ESLint 错误和 1 个 TypeScript 错误，最终源码差异为 `+796 / -8`
- 另新增本说明文档；没有修改 `applicationId`、provider authority、版本号或构建配置

规范修正只涉及类型声明、运算符换行、Promise 回调写法和移除一个多余的超时参数，不改变功能逻辑。

本分支保留上传源码的全部改动，包括一项与车机功能无关的修改：删除同步连接成功时的 `Sync connected` Toast，见 `src/plugins/sync/client/client.ts`。审阅或拆分为聚焦 PR 时需要特别注意这一项。

## 2. 用户可见功能

新增三个默认关闭的设置项，旧配置无需迁移：

| 设置键 | 位置 | 作用 |
| --- | --- | --- |
| `player.isShowCarWithLyric` | 设置 → 播放 | 向 CarWith / Jovi InCar 提供整首歌词和当前逐句歌词 |
| `common.followCarWithTheme` | 设置 → 主题 | 连接 CarWith 时按车机上报的亮暗模式切换主题 |
| `common.followSunTheme` | 设置 → 主题 | 连接 CarWith 时按定位城市的日出日落切换主题 |

系统深色、车机深色、日出日落判定采用“或”关系：任一来源要求深色时使用 `theme.darkId`，否则使用 `theme.id`。这也使原来的“跟随系统深色”从固定使用 `black` 改为使用 `theme.darkId`；默认配置仍为 `black`，但自定义 `darkId` 时的行为会不同。

## 3. 实现路径

### 3.1 逐句歌词

1. 播放设置页新增车机歌词开关，并与已有蓝牙歌词开关共用逐句歌词事件源。
2. `src/core/init/player/lyric.ts` 在逐句回调中附加 `lyricLine`，同时保留歌名、歌手和专辑名。
3. `src/core/lyric.ts` 在切歌时发送整首 `lyric`，并清空上一首的 `lyricLine`。
4. `src/plugins/player/playList.ts` 与 `src/plugins/player/utils.ts` 扩展播放元数据，将 `lyric` / `lyricLine` 传给原生轨道播放器。
5. 原生侧需要将这两个字段写入 `MediaMetadataCompat` 的 `ucar.media.metadata.LYRICS_WHOLE` 和 `ucar.media.metadata.LYRICS_LINE`。

关闭蓝牙歌词时，只有车机歌词也已关闭才会停止共用事件源，避免两个开关互相干扰。

### 3.2 车机与日出日落主题

1. 原生桥接负责观察 CarWith 连接和 `Settings.Global.ucar_night_mode`，将状态写成 `carlink_state.txt`，格式为 `连接(0/1)|深浅(-1/0/1)`。
2. `src/core/init/sunTheme.ts` 每 2 秒读取该文件；两个主题跟随开关都关闭时不读文件、不定位、不发起网络请求。
3. `src/utils/sunState.ts` 保存连接状态和昼夜判定，避免轮询引发全局 Redux 更新。
4. `src/utils/sunLocation.ts` 管理 IP 定位、缓存、失败退避及请求频率；`src/utils/sunrise.ts` 根据经纬度和日期计算日出日落。
5. `src/theme/themes/index.ts` 将车机昼夜状态并入主题选择。

定位仅在已连接 CarWith 且启用日出日落跟随时进行。代码会通过 HTTPS 请求 `ipinfo.io`、`ipwho.is` 和 `get.geojs.io`，这些第三方服务会收到用户 IP。常规刷新间隔为 2 小时，接近日出日落时缩短为 30 分钟，并带有一分钟节流、失败退避及每日请求轮次限制。未定位成功时使用内置的北京坐标作为兜底。

## 4. 文件清单

### 新增 7 个文件

| 文件 | 作用 |
| --- | --- |
| `src/core/init/sunTheme.ts` | 车机状态轮询、昼夜状态合成及主题刷新 |
| `src/utils/sunState.ts` | 车机主题运行时状态 |
| `src/utils/sunLocation.ts` | IP 定位、缓存、调度及限流 |
| `src/utils/sunrise.ts` | 日出日落计算 |
| `src/screens/Home/Views/Setting/settings/Player/IsShowCarWithLyric.tsx` | 车机歌词设置项 |
| `src/screens/Home/Views/Setting/settings/Theme/FollowCarWithTheme.tsx` | 车机亮暗跟随设置项 |
| `src/screens/Home/Views/Setting/settings/Theme/FollowSunTheme.tsx` | 日出日落跟随设置项及状态文案 |

### 修改 15 个文件

| 文件 | 改动摘要 |
| --- | --- |
| `src/config/defaultSetting.ts` | 增加三个设置的默认值 |
| `src/types/app_setting.d.ts` | 增加三个设置的类型声明 |
| `src/core/init/index.ts` | 注册车机主题初始化 |
| `src/core/init/player/lyric.ts` | 逐句回调增加车机元数据分支 |
| `src/core/lyric.ts` | 切歌时发送整首歌词并重置逐句歌词 |
| `src/plugins/player/playList.ts` | 扩展播放元数据及歌词开关逻辑 |
| `src/plugins/player/utils.ts` | `NowPlayingTitles` 增加 `lyricLine` |
| `src/screens/Home/Views/Setting/settings/Player/IsShowBluetoothLyric.tsx` | 修复蓝牙与车机歌词开关联动 |
| `src/screens/Home/Views/Setting/settings/Player/index.tsx` | 挂载车机歌词设置项 |
| `src/screens/Home/Views/Setting/settings/Theme/index.tsx` | 挂载两个车机主题设置项 |
| `src/theme/themes/index.ts` | 合并系统、车机和日出日落深色判定 |
| `src/lang/zh-cn.json` | 增加 10 条简体中文文案 |
| `src/lang/zh-tw.json` | 增加 10 条繁体中文文案 |
| `src/lang/en-us.json` | 增加 10 条英文文案 |
| `src/plugins/sync/client/client.ts` | 删除同步连接成功 Toast（与车机功能无关） |

## 5. 完整功能所依赖、但本分支没有包含的内容

**本分支只包含上传源码中的 JS/TS 层改动，不是可以直接构建出完整车机功能的独立原生实现。**

上传说明中提到的以下内容不在源码压缩包内，因此也没有被提交到本分支：

- 对 `classes.dex` 中 `TrackMetadata`、`MetadataManager` 和 `MainApplication` 的 smali 注入；
- 新增的 `classes2.dex` / `CarLinkBridge`，即 CarWith 状态文件的生产者；
- Hermes bundle、APK 重打包、对齐及签名脚本和产物。

因此，直接按普通 React Native 流程构建本分支时，可以看到新增设置并执行 JS/TS 逻辑，但原生侧尚不会写入 CarWith 专用歌词元数据，也没有原生组件生成 `carlink_state.txt`。若考虑合入上游，建议先将桥接与元数据写入实现为仓库内可维护的 Android 原生源码，而不是依赖针对特定 APK 混淆类名的 dex 后处理。

## 6. 本次核对与验证

- 上游 `v1.9.2^{}` 确认为 `0669d1b6d419967822ff52ec06e50b9613bfd136`，与本地基线逐文件一致。
- 上传包附带的 `SHA256SUMS.txt` 共 759 条，全部校验通过。
- 上传补丁可在上游基线上干净应用；规范修正前与上传源码树逐文件一致。
- 实际源码差异仅涉及上述 22 个 `src/` 文件；`src/config/constant.ts` 和 Android 包名配置均保持上游原值。
- `git diff --check` 通过；三份语言包均为有效 JSON，且各有 530 个不重复的 key。
- 本次改动的 19 个 TS/TSX 文件单独运行 ESLint 全部通过。
- 全仓 ESLint 在本分支和上游基线均为 37 个错误、1 个警告，结果一致，未引入新增问题。
- 全仓 TypeScript 检查在本分支和上游基线均未通过；对照错误集合一致，本次新增的 `sunLocation.ts` 类型错误已修复。
- 本次同步未构建 APK，也未进行 CarWith / Jovi InCar 实机验收。

## 7. 建议上游重点审阅

1. 是否接受 CarWith 专用元数据键和 `ucar_night_mode` 这一平台协议依赖。
2. 是否接受日出日落功能访问三家第三方 IP 定位服务，以及相应的隐私说明和开关策略。
3. 原生桥接应如何纳入正式 Android 源码、管理生命周期并处理权限和异常。
4. 系统深色主题改用 `theme.darkId` 是否符合原有产品设计。
5. 与车机无关的同步 Toast 删除是否应拆出或还原。
6. 本分支基于发布标签 `v1.9.2`；若提交上游 PR，需要按上游贡献指南迁移到最新 `dev` 分支并重新解决差异。
