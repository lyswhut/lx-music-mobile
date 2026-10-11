# lx-music → HarmonyOS 移植 · Handoff 交接文档

> 最后更新：2026-10-11 · 分支 `feat/harmony-port`（**从未动过 master**）
> 配套阅读：`docs/superpowers/plans/2026-10-10-lx-music-harmony-port.md`（分阶段计划）

把 **lx-music-mobile**（React Native 安卓端）移植到 **HarmonyOS NEXT**，走 **RNOH（React Native for OpenHarmony）** 路线。本文档交接「当前到哪了、怎么构建运行、踩过哪些坑、下一步做什么」。

---

## 0. TL;DR 现状

- **Phase 0（RNOH 骨架 + 真机渲染）✅ 完成并真机验证**：最小 RN 页在真机渲染出来过。
- **Phase 1 Task 1.2（Wix 导航 → react-navigation v6）✅ 完成**：全量 App 的 harmony bundle 能构建。
- **Phase 1 Task 1.1（OH 移植原生库接入）✅ 构建通过 + 真机运行到渲染**：
  clipboard/async-storage/exception-handler/quick-base64/pager-view/fs 已注册，`getEnforcing` 崩溃已解决。
  真机上 **App 已经在渲染**（RN 层 + 导航工作），只是开发模式错误浮层（RedBox）盖着若干未接入模块的报错。
- **当前所在**：全量首页已在真机正常渲染，搜索返回歌曲列表；screens、安全区域、图标字体和抽屉已接通，滑块原生组件已注册。工具模块、fs/gzip/AsyncStorage、AVPlayer/HTTP/后台播放已验证；CryptoModule 的 SHA1/AES/RSA 已接通并通过真机独立向量测试。QuickJS 自定义音源已实现，电脑测试和真机 probe 均通过；真实音源端到端播放与 MVP 仍未完成。
- **MVP 目标**（用户确认）：**自定义音源(QuickJS) + 搜索 + 播放**。桌面歌词、本地媒体元数据 **不做**。

### 已提交 commit（`git log d295604..HEAD`）
```
5b414518 完善导航、原生播放与加密并完成真机验证
6dcc5306 鸿蒙移植 handoff 交接文档 + file-system 委托 react-native-fs
8ed9052 OH 原生模块注册打通,全量 App assembleHap 构建成功
78fac33 wip: 接入 OH 移植库 JS 依赖 + har/autolink 配置
d79e91e Wix RNN → react-navigation v6（Task 1.2）
e072eec enableCAPIArchitecture 修复 API26 渲染崩溃，Phase 0 真机跑通
31c4b96 适配 RNOH hvigor 插件 0.2.0 单一工厂 API
748b92c 对齐 RNOH 0.72.144 ArkTS API
cd73620 修正 hvigor 插件 tgz 路径
2458459 接入 RNOH 原生宿主（EntryAbility/RNApp/C++/hvigor 插件）
6ee8681 metro 接入 harmony 平台，打通 bundle-harmony
82087d6 接入 RNOH 运行时依赖 @react-native-oh/react-native-harmony@0.72.144
b4b342b 回退 RN 0.73.11→0.72.5，vendor 化 github fork 依赖
5fe2498 docs: 移植实施计划
```
后续阶段提交以 `git log` 为准；以下按日期保留实施过程和验证范围。

### 2026-10-11 · 新电脑接续记录

- 已拉取并切换到 `feat/harmony-port`。实际工程位置为 `D:\Projects\Harmony\lx-music-harmony`；DevEco 安装在 `D:\Projects\Harmony\DevEco Studio`，工具路径与 §2 的旧电脑不同。
- 首次 `npm ci` 因 lock 缺少 `fsevents@2.3.3` 失败；`npm install` 已补齐 lock、安装依赖并执行 autolinking 补丁。`ohpm install` 已完成。
- 新检出没有被 gitignore 的 `entry/.rnoh-autolink` 目录，旧 autolinker 不会自行创建。`harmony/hvigorfile.ts` 现在自动创建目录；新增 `harmony/.npmrc` 满足 hvigor 的项目级 registry 配置要求。
- `hvigor clean` 后原先的 `BuildNativeWithCmake` 错误未再出现；C++/ArkTS 编译通过。打包还需要把 DevEco 的 `jbr/bin` 放入 PATH，否则出现 `spawn java ENOENT`。
- `UtilsModule` 实现窗口尺寸（像素）、窗口变化事件、息屏事件、保持亮屏、退出、设备名/ABI/语言、Wi-Fi IPv4、分享与通知授权。注册点为 `LXMusicPackage`（ArkTS + C++）。APK 安装明确拒绝，安卓电池优化接口返回 false；后台播放仍须后续实现 AVSession。
- JS 在 Harmony 使用 `TurboModuleRegistry` 获取工具模块；通知授权直接等待原生 Promise，避免等待 Android 设置页的 AppState 回前台事件。事件退订及模块销毁会清理监听。
- `npm run bundle-harmony` / `bundle-harmony:release` 已固定使用 `index.harmony.js`。bundle 构建、`assembleHap`、工具模块定向 TypeScript 检查与桥接模拟验证通过；模拟覆盖权限允许/拒绝、语言/IPv4/像素尺寸、分享、保持亮屏、重复订阅及销毁期间的异步竞态。尚未证明全量 App 可完成初始化，crypto/userApi/cache/播放器等模块仍待接入。
- 本机 `JAVA_HOME=D:\Projects\Harmony\DevEco Studio\jbr`，`DEVECO_SDK_HOME=D:\Projects\Harmony\DevEco Studio\sdk`；PowerShell 调用 `npm.cmd` 可避开 npm.ps1 的执行策略限制。
- 当前产物：`harmony/entry/build/default/outputs/default/entry-default-unsigned.hap`。`build-profile.json5` 的 `signingConfigs` 为空；需要在本机 DevEco 配置签名、连接设备后才能安装和验证 fs 设置持久化及工具模块行为。
- 真机现已连接，`hdc install -r` 安装上述包明确失败：`9568320: no signature file`。已请用户在 DevEco 的 Signing Configs 登录并启用自动签名；签名完成后重新 `assembleHap`，用 signed.hap 覆盖安装（保留应用数据）。
- 设备上仍有旧包，`aa start -a EntryAbility -b com.wingsluo.lxmusic` 可启动；其 JS 日志报 `RNCClipboard could not be found`。这是旧安装包的日志，不能据此判断当前源码和新包的行为。签名完成后必须重新安装最新包再采集日志。

### 2026-10-11 · 真机验证结果

- 用户已在本机 DevEco 配好签名，`assembleHap` 生成 signed.hap，`hdc install -r` 成功。签名配置含本机凭据，不能随源码提交。
- 最新全量 App 已安装启动，原来的 RNCClipboard 报错消失，出现 track-player 导入错误：`Cannot read property 'RATING_HEART' of null`。位置为 `vendor/react-native-track-player/src/interfaces.ts` 的 RatingType；当前 fork 依赖安卓 `NativeModules.TrackPlayerModule`，需按 Phase 2 接入 OH 4.x 后适配 API，不能仅用空模块掩盖。
- 新增独立验证入口 `index.harmony.smoke.js`（`npm run bundle-harmony:smoke`）。不依赖播放器，可直接验证工具模块和现有 fs/AsyncStorage；首次启动写入测试数据、gzip，第二次启动检查文件和设置仍一致、解压还原并清除测试数据。其标记文件和 AsyncStorage key 与业务数据隔离。
- 首次 gzip 真机验证暴露 Buffer 的嵌套 `react-native-quick-base64@2.2.2`（安卓实现）导致 `global.base64ToArrayBuffer is not a function`。新增 npm override，让 Buffer 的 base64 依赖使用根 OH alias，并清除 lock 中两个旧嵌套包后重装；`npm ls react-native-quick-base64` 与 `npm ci --dry-run` 通过。
- 修复后真机两次启动验证页面显示 `ALL CHECKS PASSED`：设备名 nova 14 Ultra、语言 zh_cn、ABI arm64-v8a、窗口 1272×2860px、通知状态查询 false、Wi-Fi IPv4、包含中文及 emoji 的 UTF-8 文件读写、gzip 往返、文件与 AsyncStorage 重启持久化全部通过。亮屏/分享/权限申请/息屏事件的实际交互仍待验证。
- 完成验证后恢复全量 `index.harmony.js` bundle。后续构建全量 App 使用 `npm run bundle-harmony`；要复测基础模块才使用 smoke 入口。

### 2026-10-11 · 播放器与启动链继续移植

- 检查 `@react-native-oh-tpl/react-native-track-player@4.1.2` 发布代码发现：初始化 Promise 在创建 AVPlayer 回调前完成、缺少 playback/remote 事件发射、seekTo(0) 不结束 Promise、队列删除不调整当前索引、AVSession 控制直接操作队列。因此没有安装此包；新增 `LXTrackPlayer` 原生 TurboModule（`TrackPlayerModule.ets` + `LXMusicPackage.h` 方法表），保留旧 vendor 外部接口。
- Harmony JS 为 `vendor/react-native-track-player/src/trackPlayer.harmony.ts`。静态常量解决 RATING_HEART null，秒级进度不额外除以 1000。HTTP headers/User-Agent 传递到 AVPlayer。队列操作串行，等待 prepare/seekDone；支持暂停、恢复、停止、音量、倍速、重复模式、元数据/歌词、AVSession remote 事件，以及 `//default` 占位轨道的旧 `playback-track-changed`。占位轨道不打开文件。
- AVSession + AUDIO_PLAYBACK 长时任务在播放时启动，暂停/停止/销毁释放。manifest 新增 KEEP_BACKGROUND_RUNNING 和 audioPlayback 模式。设备 API 26；setPlaybackRate 需要 API 20，低版本未测。
- 真机入口 `index.harmony.player-smoke.js`，`npm run bundle-harmony:player-smoke`。隔离的 100 秒 WAV 覆盖播放、暂停稳定进度、seekTo(0/5)、删前序轨道索引调整、曲终进入占位轨道和旧事件、reset/destroy/reinitialize；已显示 `ALL PLAYER CHECKS PASSED`。
- HTTP 服务：另开终端运行 `node scripts/harmony-player-probe-server.mjs`，执行 `hdc rport tcp:18080 tcp:18080`。服务拒绝缺指定 User-Agent/header 的请求；真机 HTTP 10 秒 WAV 播放和请求头验证通过。首次只等 500ms 检查进度失败，改为 5 秒内等实际进度后通过。外部音源/HTTPS 尚未验证。
- 一次后台复测受到其他设备活动/音频焦点干扰，长延迟返回时音频已结束，该次不能算通过；随后控制 Home 窗口 60 秒，位置约 66.5 秒，通过。AVSessionService dump 确认 LX Music 会话。后台定时器另有最后一轮复测，见后续最新记录。
- 播放磁盘缓存未实现：isCached=false、缓存大小 0、无缓存可清理。Android maxCacheSize/audioOffload 不代表已支持。锁屏按钮/耳机遥控、HTTPS/HLS、重复模式、快速切歌压力仍待测。
- `cache.harmony.ts` 用 RNFS 统计/清理应用 cache 目录，不碰 DocumentDirectoryPath 设置与列表，清理交互待测。
- 全量入口先暴露 UserApiModule.destroy null，缺失实例销毁/订阅已安全返回；loadScript/sendAction 明确拒绝未实现引擎，未伪造 QuickJS。随后暴露桌面歌词 setPlaybackRate null；按原定范围降级，show/授权拒绝，关闭和配置无操作，Harmony 不订阅缺失歌词事件。
- 新增 RNBackgroundTimer ArkTS 定时器 + C++ 桥接，vendor Harmony 使用 DeviceEventEmitter，取消会释放原生定时器。后台保活由播放器 AUDIO_PLAYBACK 提供，普通定时器不单独申请。
- 定向 TypeScript 检查（播放器、cache/lyricDesktop/userApi）诊断 0，ArkTS/C++ 编译签名通过。更改未提交，用户签名凭据不能提交。
- 最后一轮将 probe 的等待改用新 RNBackgroundTimer，真机重新显示 `ALL PLAYER CHECKS PASSED`（进度约 70.2 秒、HTTP/曲终/销毁重建全通过），说明新的原生定时器事件链可用。测试 HTTP 服务已停止，`hdc fport rm tcp:18080 tcp:18080` 已移除本次反向映射。
- 最后恢复全量 bundle、assembleHap、signed.hap 覆盖安装并启动。init 不再报 UserApi/桌面歌词 null，进入导航渲染，出现 screens 缺组件的 Render Error。设备当前安装的是全量应用，非 probe。
- **下一步导航根因已定位**：`node_modules/...react-native-harmony-cli/dist/core/ProjectDependenciesManager.js` 的 forEachDependencyInDirectory 仅检查 dirent.isDirectory()，不会跟随 npm `file:` vendor 的符号链接，因此 screens har/codegen/autolinking 都被跳过。即使扫描到 vendor，package harmony.codegenConfig 指向的 `src/specs` 也不存在（只有官方 `src/fabric`）。原 OH 3.34.0-0.0.1 npm 包有完整 specs，har 是 ArkTS screens（C++ 工厂不创建组件实例），需要配套 ArkTS 注册与 RNApp arkTsComponentNames，而非仅加 C++。
- 该 har 导出 `RNOHScreensPackage` 为 default class，但 index.ets/ts.ts 只 export *，下一步需适配导入；原生代码依赖生成的 RNC/TM 和 px2vp。检查过的 npm tgz/har 解包均在系统 TEMP，未改变当前 screens 集成。修复建议先把 vendor specs/扫描与注册配套补齐，再真机构建验证；旧 handoff 的「导航工作」仅指旧最小页，不能视作全量首页已验证。

---

### 2026-10-11 · 全量首页与导航组件修复

- 新增独立 npm 依赖 `@react-native-oh-tpl/react-native-screens@3.34.0-rc.6`；其真实安装目录可被旧 autolinker 扫描，具有完整 specs 和正确 default 导出。`vendor/react-native-screens` 保留官方 JS，移除错误 harmony 元数据，Harmony Metro 使用 OH alias；补上根 har、ETS/C++ 工厂和 RNApp 的 screens ArkTS 组件名。保留 C-API 架构。
- screens 修复后真机暴露 `RNCSafeAreaProvider` 缺失，补齐 safe-area-context autolinking + ETS/C++ 注册。当前 SDK 构建未出现旧记录的 px2vp 错误；safe-area 是 C++ 组件，不加入 ArkTS 名单。Root 使用安全区域包裹，避开状态栏和底部手势区域。
- `DrawerLayoutAndroid` 在 Harmony 落入 UnimplementedView（红框、内容挤到左侧）。新增平台文件 `DrawerLayoutFixed.harmony.tsx`，使用 RN View/Pressable 实现侧栏、点击遮罩关闭及 BackHandler 关闭；安卓入口保持原实现。当前未做边缘拖动/滑入动画。
- `scripts/prepare-harmony-assets.mjs` 从已有 `src/resources/fonts/icomoon.ttf` 复制字体到 rawfile，所有 bundle scripts 调用；RNApp 注册 icomoon。字体生成目录忽略。真机菜单/搜索/播放器图标已显示。
- 播放详情暴露 `RNCSlider` 缺失：har 有 C++ SliderPackage 和 ArkTS RNCSlider，但未提供 ETS Package。新增 HarmonySliderPackage builder，补 C++ 注册、autolink rnoh_slider 和 ArkTS 名单；编译签名通过。最后真机点击封面打开 Vienna 播放详情，专辑图、控制按钮和进度滑块正常显示；实际 seek 待接通音源后验证。
- OH react-native-fs 的 unlink 总调用 fs.rmdir，普通文件删除失败。新增 HarmonyFsPackage，继承现有 FsTurboModule，仅按 stat 区分 unlink/rmdir，并补事件接口；启动清理先判断临时文件存在并捕获错误。smoke 入口增加普通文件和非空嵌套目录删除检查。
- Harmony 不再显示安卓「忽略电池优化」设置提醒，后台播放由已接入的 AVSession/AUDIO_PLAYBACK 保活。
- 真机已看到正常全宽搜索页，以及 Billy Joel 的 Vienna/Piano Man 等真实搜索结果。真实歌曲播放尚未通过，日志出现 `sha1`/`aesEncryptSync` null 和 `Api is not found`；下一步应实现 crypto 与 QuickJS，而非标记 MVP 完成。设备同时被用户操作，连续坐标自动化测试会受影响。
- 本次修改仍未提交；继续保留用户的 build-profile.json5 签名凭据。
- 删除修复最终真机复测显示 `File + nested directory deletion PASS`，重启后 `Restart persistence + gzip PASS; probe data removed` 和 `ALL CHECKS PASSED`。通知状态此时为 true（用户已授权）；测试数据已清理，最终重新安装的是全量入口。
- 依赖 lock 的 `npm ci --dry-run --ignore-scripts`、bundle、ArkTS/C++ 构建签名和 diff 检查通过。导航/抽屉/工具/启动清理定向 TypeScript 检查无新增错误；扩大到 tools.ts 检查时发现其原有第 522 行 unused @ts-expect-error，未修无关代码。
- 剩余日志：react-native-fs 的 NativeEventEmitter 仍警告缺 addListener/removeListeners（仅 ETS 追加方法不足以更新原 C++ 方法表）；一次恢复上一首的 AVSession 元数据报 `SetAVMetaData failed : native invalid parameters`。下一步需要检查真实 musicInfo 的 duration/id/artwork 与原生 AVMetadata 类型及错误处理。不能把播放器 probe 通过等同于全部业务元数据通过。
- 最后一轮确认抽屉打开/点击遮罩关闭、封面 push 到播放详情、详情左上返回按钮 pop 回搜索页；未证明系统 Back 手势链路全部可用。

---

### 2026-10-11 · 加密模块与元数据修复

- 新增 `CryptoModule.ets`，使用系统 cryptoFramework 实现 SHA1、AES128/192/256 CBC/ECB PKCS7、ECB NoPadding、RSA1024/2048 NoPadding/OAEP SHA1，以及 RSA2048 密钥生成；ETS 工厂、C++ 方法表与 JS TurboModuleRegistry 均已注册，没有增加 npm 加密依赖。
- 保留安卓端的 Base64 输入/密钥、加密 Base64 输出、解密 UTF-8 输出和 SPKI/PKCS8 格式。旧 `AES_MODE.ECB_128_NoPadding` 的实际值是 `AES`，Java 默认采用 ECB PKCS5/7，因此 Harmony 同样按 PKCS7 处理；显式 `AES/ECB/NoPadding` 才不填充。CBC IV 继续截断/补零到 16 字节。
- 新增 `npm run bundle-harmony:crypto-smoke`：Node crypto 生成独立预期值与一次性密钥到被忽略的 `crypto-probe.json`。真机报告 `ALL CRYPTO CHECKS PASSED`，覆盖 SHA1 中文/emoji/空串、AES 三种密钥长度与全部上述模式的同步/异步加解密、空文本解密、RSA 两种长度的 raw 加密/OAEP 解密和往返、生成 PEM 密钥对、非法 AES 密钥拒绝。尚无同一向量在安卓真机的对照结果。
- 真机发现 SDK 在空文本 AES 解密后返回 null DataBlob，已转为空串；SHA1 空输入因 SDK 不创建摘要上下文，直接返回标准空串摘要。RSA cipher 参数使用实际模数位数，避免导入 1024 位密钥后仍按 2048 位处理。
- `TrackPlayerModule.publishMetadata` 将负数/非有限 duration 归零并转换为整数毫秒，空 assetId 回退到当前轨道或 `lxmusic`。播放器 probe 增加 `duration: -1` 与清空元数据回归检查。
- 更新后的播放器 probe 真机报告 `ALL PLAYER CHECKS PASSED`：负时长/清空元数据、暂停/seek/队列删除、Home 后后台播放 65 秒（位置约 70 秒）、曲终占位轨道、HTTP 请求头、销毁重建均通过；测试服务和反向端口映射已清理。
- `patch-oh-autolinking.mjs` 在 postinstall 中将 react-native-fs 的 Harmony 事件监听切换为 DeviceEventEmitter，对应原生全局事件，避免 NativeEventEmitter 的 addListener/removeListeners 警告；其他平台保持原实现。
- 最终恢复全量 bundle、构建签名并覆盖安装，正常进入首页；启动日志不再出现 crypto null 或 AVMetadata 参数错误，自定义音源仍明确提示引擎未实现。启动仍有一组 NativeEventEmitter 缺 addListener/removeListeners 警告，fs bundle 已确认使用 DeviceEventEmitter，需继续定位其他库（如 Clipboard）；不能认为全部 emitter 警告已消除。一次性 crypto fixture 已从最终包移除。
- ArkTS/C++ 编译及签名通过。同步 cryptoFramework API 需要 API12+，本轮验证设备为 API26。本节及此前续接修改随本次移植提交一起入库（见 `git log`），用户的本机签名配置和构建产物不入库。

---

### 2026-10-11 · 无真机续接：QuickJS 音源引擎

- 用户要求吃饭期间继续无需真机的工作，并要求今后按可验证阶段提交，便于回溯；本阶段没有调用 hdc、安装或操作设备。
- 从 QuickJS 官方 `quickjs-2025-09-13-2.tar.xz` 引入未修改的核心源码和 MIT 许可，来源及 SHA256 见 `cpp/quickjs/README.md`。仅链接引擎，不链接 quickjs-libc 的文件/进程/网络能力。Windows 上上游 `VERSION` 文件会覆盖 C++ `<version>`，已按源码清单排除。
- `ScriptRuntime` 为每个上下文设置 64 MiB 内存、512 KiB 栈、每次执行/调用/Promise job 批次共用 5 秒中断期限。`NativeBridge` 提供 create/evaluate/call/destroy NAPI；`liblx_user_api.so` 已编译为 AArch64 并打包到 HAP。
- `UserApiWorker.ets` 在 ThreadWorker 内持有 QuickJS，复用安卓 `user-api-preload.js` 与 `lx` API 2.0.0。脚本请求/取消经原有 RN 网络层；同步 Base64/MD5/AES/RSA 在 worker 中执行。CryptoOperations 从 UI TurboModule 中分离，worker 不加载 RNOH UI 包。
- `UserApiModule` 的 ETS/C++ 注册、JS TurboModuleRegistry/DeviceEventEmitter 已接通。销毁清理定时器及运行时，代次过滤旧 worker 事件和异步 preload 结果；执行异常/超时关闭当前 worker，后续加载创建新环境。脚本未发出 init 事件时 20 秒报错；现有业务网络超时保持不变。
- WSL/GCC/Node24 的三组 CTest 全部通过：引擎协议/沙箱/内存/Promise 无限循环；真实 NAPI 桥与 Unicode/crypto callback/异常/重复 destroy；实际 ETS host/worker 代码转译后的线程联调（网络响应/取消、定时器、加载和请求死循环、主线程心跳、初始化超时、源切换及销毁）。测试只替换鸿蒙平台 API，不能视为 Harmony 真机结果。测试命令见 `cpp/userapi/README.md`。
- `userApi.ts` 定向 TypeScript 检查诊断 0；全量及新 `bundle-harmony:userapi-smoke` bundle、ArkTS/C++ 与 signed HAP 构建通过。新增 probe 覆盖初始化、请求、timer、模拟网络回包、MD5/Base64、5 秒中断与恢复，待设备返回后运行。
- 检查 quick-md5 发现现有包已自带 SparkMD5 纯 JS fallback，电脑端空串/ASCII/中文 emoji/长字符串与 Node MD5 一致；暂不为 Harmony 增加另一套依赖或全局替换，设备端 fallback 黄金值仍待验。
- 下一步必须先在 Harmony 真机检查 worker 路径/NAPI 加载和系统 cryptoFramework 的线程行为，再导入真实音源、获取 URL 并播放。不要把本阶段标成 MVP 达成。用户签名凭据及构建目录继续不提交。

---

### 2026-10-11 · QuickJS 真机验证

- 首次新包启动发现 `sourceOption.workers` 只列自定义音源 worker，覆盖了默认扫描，导致 `RNOHWorker.ets` 未打包。补全两个 worker 后启动正常；这也是只构建无法发现的问题。
- USB 真机 `bundle-harmony:userapi-smoke` 报告 `ALL USER API CHECKS PASSED`：ThreadWorker/NAPI 加载、音源初始化/Promise/定时器/错误回传、5 秒死循环中断且 app 心跳继续、脚本切换/恢复均通过。
- 扩展 probe 从 Node 独立向量检查 worker 内 AES128 CBC/ECB、RSA1024/2048 raw 加密；实际系统 cryptoFramework 线程内操作通过。RN quick-md5 fallback 中文/emoji 摘要匹配 Node MD5。
- 网络检查改走现有 `fetchData` 及实际 HTTP 请求，电脑服务 `/source-probe` 验证自定义请求头后返回 JSON；经 worker 回调得到预期 URL。复测仍全部通过。复测需 `node scripts/harmony-player-probe-server.mjs` + `hdc rport tcp:18080 tcp:18080`。
- 以上使用隔离 probe，不修改用户保存的脚本或设置。真实用户音源与播放链路仍须继续联调。

### 2026-10-11 · 音源缓冲区转换修复

- 回归测试发现安卓 preload 的字节数组转 Base64 先经过 UTF-8，导致大于 127 的字节被改写，中文 emoji 的 UTF-8 转换也不完整。新增 Harmony 构建适配器，生成 preload 时将转换接到 worker 的原生 Base64/UTF-8 回调。
- 修复前全部 256 个字节的独立 Base64 向量失败；修复后三个离线 CTest 套件通过。真机 probe 新增全部字节、中文 emoji 往返以及 buffer 输入 AES 向量，再次显示 `ALL USER API CHECKS PASSED`。
- 用户提供在线测试音源 `https://liuyang-public.oss-cn-beijing.aliyuncs.com/flower-v1.0.0.js`（野花🌷）。已下载用于联调，第三方脚本不入库；真实导入和取流播放继续验证。
- 恢复全量 bundle、签名构建并覆盖安装后，设置页已有野花🌷 v1，显示「初始化成功」。Billy Joel 搜索返回真实列表，Vienna 播放请求经 QuickJS 到达音源服务器；kg/kw/tx/wy/mg 取流接口均返回 HTTP 404，换源后仍失败，进度为 00:00。电脑直接请求同一 tx 接口也返回 nginx 的 `404 Not Found`，因此不能标记真实播放或 MVP 已通过。已请用户提供当前可用的其他测试音源。
- Clipboard 的嵌套 JS 包仍构造 NativeEventEmitter，导致监听方法警告。postinstall 补丁改为 Harmony DeviceEventEmitter；完整应用启动后的进程日志不再出现 NativeEventEmitter 警告。
- 真机最终安装的是完整应用；隔离测试 HTTP 服务、端口映射和 crypto fixture 已清理。

---

## 1. 版本配套（关键，别乱动）

| 组件 | 版本 | 说明 |
|---|---|---|
| React Native | **0.72.5** | 从 0.73.11 回退。RNOH 无 0.73 版,成熟线是 0.72.x |
| @react-native-oh/react-native-harmony | **0.72.144** | RNOH JS overlay + .har 原生 SDK |
| @rnoh/hvigor-plugin | **0.2.0** | 随上包附带的 tgz,**单一工厂 `createRNOHHvigorPlugin`**（非新版双插件） |
| babel 预设 | `metro-react-native-babel-preset@^0.76.8` | 0.72 线无 `@react-native/babel-preset` |
| @react-native/metro-config | 0.72.12 | |
| react-navigation | **v6**（native 6.1.18 / native-stack 6.11.0） | 匹配 OH 版 screens 3.34 |
| DevEco Studio | **26**（装在 `D:\Project\Harmony\DevEco Studio 26`） | all-in-one,内置 SDK |
| 设备 | MRT-AL10 · **API 26** · OpenHarmony 7.0.0.105 · 无线 hdc | |

---

## 2. 构建 / 运行 / 调试 配方（命令行,全自主）

> ⚠️ 本机 **github.com 被墙**,依赖走 npmmirror/ohpm/CDN。`hdc`/`node`/`hvigor`/`ohpm` 路径见下。
> ⚠️ **禁止 `git clean -fdx`**（会删未跟踪的 `harmony/`）。

### 环境变量 / 工具路径
```bash
NODE="D:/Project/Harmony/DevEco Studio 26/tools/node/node.exe"
HVIGOR="D:/Project/Harmony/DevEco Studio 26/tools/hvigor/bin/hvigorw.js"
OHPM="D:/Project/Harmony/DevEco Studio 26/tools/ohpm/bin/ohpm.bat"
HDC="/d/HarmonySDK/20/toolchains/hdc"
export DEVECO_SDK_HOME="D:/Project/Harmony/DevEco Studio 26/sdk"   # all-in-one 内置 SDK,不是 D:\HarmonySDK
```

### 打 JS bundle（改了 src/ 后）
```bash
# 全量 App 入口是 index.harmony.js（注册 Root 为 'lxmusic' + import ./src/app）
npx react-native bundle-harmony --dev true --entry-file index.harmony.js
# 产物 → harmony/entry/src/main/resources/rawfile/bundle.harmony.js（gitignore,不入库）
```

### 构建 hap（在 harmony/ 目录;改了原生/配置后）
```bash
cd harmony
"$NODE" "$HVIGOR" --mode module -p product=default -p buildMode=debug assembleHap \
  --parallel --incremental --no-daemon
# 产物 → harmony/entry/build/default/outputs/default/entry-default-signed.hap（签名已配好）
```
> 加了新 OH .har 到 oh-package.json5 后,先 `"$OHPM" install`（在 harmony/）装进 oh_modules。
> **卡住就 `hvigorw clean` 后全量重建**（增量偶发脏状态,见 §6）。

### 装机 + 启动 + 看日志 + 截图
```bash
"$HDC" install -r entry/build/default/outputs/default/entry-default-signed.hap
"$HDC" shell "power-shell wakeup"
"$HDC" shell aa start -a EntryAbility -b com.wingsluo.lxmusic
"$HDC" shell "pidof com.wingsluo.lxmusic"          # 空=没起来(多半设备锁屏,见下)
# JS 控制台/异常:
"$HDC" shell "hilog -x" | grep "#RNOH_JS" | sed 's/.*#RNOH_JS: //'
# 截图(注意两个坑):
"$HDC" shell "snapshot_display -f /data/local/tmp/s.jpeg"
MSYS_NO_PATHCONV=1 "$HDC" file recv "/data/local/tmp/s.jpeg" "s.jpeg"   # 必须禁 MSYS 路径转换 + dest 用简单文件名
```

### ⚠️ 设备锁屏会挡住启动
keyguard 锁屏时 `aa start` 起不来前台 Ability（`pidof` 为空,窗口焦点是 `SCBScreenLock`）。
**测试前请解锁手机并把自动锁屏(息屏)调到最长/永不**，否则每次构建的几十秒里设备就自动锁了。

---

## 3. 架构 / 关键决策

- **RNOH 承载 RN JS**：`src/` 业务代码基本复用；原生依赖要么用 `@react-native-oh-tpl/*` 移植版,要么自己 vendor/重写。
- **C-API 架构**：`harmony/entry/src/main/ets/pages/Index.ets` 的 `RNApp` 配 `enableCAPIArchitecture: true`——**这是 Phase 0 真机不崩的关键**（RNOH 0.72.144 旧 ArkTS 架构在 API26 的窗口接口会 SIGSEGV）。`arkTsComponentNames` 注册 screens 与 RNCSlider，safe-area 使用 C++ 组件。
- **导航**：Wix RNN 全原生,RNOH 不支持 → 换 **react-navigation v6**。重写了 `src/navigation/` **内部**（`navigationRef` 全局命令式导航 + `Root.tsx` 的 NavigationContainer）,**对外导出 API 全保持不变**（`push*/pop/show*Modal/init/componentId/useNavigationComponentDidAppear`）,业务层 50+ 调用点零改动。`componentId → route.key`。
- **入口**：`index.harmony.js` 用 `AppRegistry.registerComponent('lxmusic', () => Root)`（appKey `lxmusic` 必须和 Index.ets 的 RNApp appKey 一致）。
- **被墙 github fork**：track-player/background-timer/file-system/local-media-metadata 本地 `vendor/`（file: 引用）。
- **bundleName**：`com.wingsluo.lxmusic`（harmony 侧,与安卓 cn.toside.music.mobile 分开）。

---

## 4. 原生库 autolinking —— 踩坑与方案（最费力的部分）

RNOH 0.2.0 autolinker 对这批早期 `@react-native-oh-tpl` 库各种不配套,逐一解决：

1. **OH 包缺 `harmony.autolinking` 元数据** → autolinker skip、原生不注册。
   → `scripts/patch-oh-autolinking.mjs`（**postinstall 自动跑**）给 5 个含 C++ 的库补 `cmakeLibraryTargetName`(rnoh_xxx)+`ohPackageName`。**node_modules 的 patch 会被 reinstall 冲掉,靠这个脚本复现。**
2. **autolinker 生成的 ETS 用 default import**，但库是 named export（`export * from './ts'`）→ ArkTS "has no default export"。
   **autolinker 生成的 C++ 引用不存在的别名头** → "file not found"。
   → `harmony/hvigorfile.ts` 把 autolinker 的 ets/cpp 产物**重定向到 `entry/.rnoh-autolink/`（编译树外）**,改由**手写**：
     - `harmony/entry/src/main/ets/RNOHPackagesFactory.ets`（named import 注册,6 个 ETS 包）
     - `harmony/entry/src/main/cpp/RNOHPackagesFactory.h`（真实头,5 个 C++ 包,`using namespace rnoh`）
   新增/删 OH 库要**同步维护这两个手写文件** + `scripts/patch-oh-autolinking.mjs`。
3. **工厂返回类型**：用基类 `RNPackage[]`（不是 `RNOHPackage[]`）——老包缺 `createWrappedCustomRNComponentBuilderByComponentNameMap`。
4. **har 依赖放根 `harmony/oh-package.json5`**（不是 entry）——CMakeLists 的 `OH_MODULES_DIR=harmony/oh_modules`。
5. 个案：**screens** 使用独立 OH rc.6 依赖提供 specs/har，vendor 保留上游 JS；**fs** 纯 ArkTS 无 C++（HarmonyFsPackage 覆盖文件删除）；**slider** 手写 ETS builder Package + 原 har C++ SliderPackage；**safe-area** 已恢复 ETS/C++ 注册并真机渲染，不需要 JS 回退。
6. 装 OH 版要 `rm package-lock.json` 后再 `npm install`（否则 npm alias 不装）。装时用 `--legacy-peer-deps`（`.npmrc` 已设）。

---

## 5. 当前正在做：App 自带/自定义原生模块

RN 侧 `getEnforcing` 硬依赖已解决；现在是 `NativeModules.XxxModule`（undefined）类模块。真机 RedBox "Log x of 5" 显示若干未接入模块报错。

- **`react-native-file-system`（vendor fork）** → 已改为**委托 `react-native-fs`（OH 版）实现**（`vendor/react-native-file-system/src/index.ts`,已入库）。gzip 用 pako；AndroidScoped(SAF 文档树)降级为桩。**构建、UTF-8 读写、gzip 与重启持久化真机验证通过。**
- **项目自带 5 模块**（`src/utils/nativeModules/`,安卓在 `android/.../cn/toside/music/mobile/`）：
  | 模块 | NativeModules 名 | 用途 | 处置 |
  |---|---|---|---|
  | `utils.ts` | UtilsModule | 窗口尺寸/退出/通知权限/电池优化/息屏 | **ArkTS + C++ 已接入**；设备信息、窗口尺寸、Wi-Fi、通知状态真机验证通过，事件与交互待测；电池优化不支持 |
  | `cache.ts` | CacheModule | 缓存清理 | Harmony 入口用 RNFS 统计/清理 cache，交互待测 |
  | `crypto.ts` | CryptoModule | SHA1/AES/RSA | **cryptoFramework 已接入并真机验证**；独立 Node 向量与同步/异步往返通过 |
  | `userApi.ts` | UserApiModule | **QuickJS 跑自定义音源脚本** | **QuickJS + worker + NAPI 已实现**；电脑测试与真机 probe 通过，真实音源播放待验 |
  | `lyricDesktop.ts` | LyricModule | 桌面歌词 | **桩**（本期不做） |
  > 注意 `utils.ts` 等在**模块顶层**就 `UtilsModule.exitApp` 取属性,undefined 会 import 崩。重写需提供 ArkTS TurboModule,或先做 JS 安全桩让 import 不崩、再逐个实现。

---

## 6. 历史构建失败（新电脑清理重建后已通过）

最后一次 `assembleHap`（改 fs 委托、重打 bundle 后）失败：
```
ERROR: Failed :entry:default@BuildNativeWithCmake
00305010 Syntax Error: Cannot read properties of undefined (reading 'name')
WARN: ... cannot be safely placed under this directory. The build may not work
BUILD FAILED in 56s
```
- fs 委托只改了 **JS**,不该影响 native。疑似 **autolinker/增量构建脏状态**（commit `8ed9052` 时是能成功构建的）。
- **先试**：`cd harmony && "$NODE" "$HVIGOR" clean` 然后全量 `assembleHap`；或删 `harmony/entry/.cxx`、`harmony/entry/build` 后重建。
- 若仍失败,查 `.rnoh-autolink/` 重定向是否生效、autolinker 这次是否又改了 `oh-package.json5`/生成文件（它会自动改根 oh-package.json5 加 har 依赖）。
- 另注意：`harmony/oh-package-lock.json5`、`harmony/entry/oh-package-lock.json5` 是 ohpm 生成的,未入库。

---

## 7. 剩余路线图（到 MVP）

1. **首页已渲染、真实搜索已返回列表、crypto 已验证**；继续复测页面 push/back/滑块交互、搜索异常输入，再做真实歌曲播放联调、AVSession 遥控和重复模式测试。
2. **下一项核心验证**（§5 表）：QuickJS/ThreadWorker/NAPI 真机 probe 已通过，继续导入真实音源取流播放；随后验证 cache 清理交互。`utils` 与 `crypto` 已接入，`lyricDesktop` 按本期范围降级。
3. **搜索 + 播放链路**（Phase 2）：已有 AVPlayer + AVSession 和旧 fork 兼容层，继续真实音源、搜索、列表和歌词端到端验证。
4. **自定义音源**跑通（QuickJS）= MVP 达成。
5. 收尾：`react-native-quick-md5`（无 OH 版,换 JS md5 或 cryptoFramework）、vector-icons 字体、release 打包。

---

## 8. 文件地图（本次移植新增/改动）

```
harmony/                                  # DevEco 工程(本地未跟踪→已逐步提交),RNOH 宿主
  hvigorfile.ts                           # createRNOHHvigorPlugin + autolinker ets/cpp 重定向
  oh-package.json5                        # RNOH .har + 8 个三方 .har 依赖(autolinker 自动加)
  hvigor/hvigor-config.json5              # @rnoh/hvigor-plugin tgz(路径 ../../node_modules)
  entry/hvigorfile.ts                     # 纯 hapTasks(0.2.0 单插件在根)
  entry/src/main/ets/entryability/EntryAbility.ets   # extends RNAbility
  entry/src/main/ets/pages/Index.ets      # RNApp, appKey=lxmusic, enableCAPIArchitecture:true
  entry/src/main/ets/PackageProvider.ets  # 返回 RNPackage[]
  entry/src/main/ets/RNOHPackagesFactory.ets   # ★手写·ETS 注册(6 包)
  entry/src/main/cpp/RNOHPackagesFactory.h     # ★手写·C++ 注册(5 包)
  entry/src/main/cpp/{CMakeLists.txt,PackageProvider.cpp}
index.harmony.js                          # harmony 入口:AppRegistry 注册 Root('lxmusic')
metro.config.js                           # createHarmonyMetroConfig
scripts/patch-oh-autolinking.mjs          # ★postinstall:补 OH 库 autolinking 元数据
vendor/                                   # 被墙 github fork 本地化 + 修复的 screens
  react-native-screens/                   # 官方完整 JS + OH 原生(OH 版 JS 残缺)
  react-native-file-system/src/index.ts   # ★改为委托 react-native-fs(已入库)
  react-native-{track-player,background-timer,local-media-metadata}/
src/navigation/                           # 全部重写为 react-navigation(对外 API 不变)
  navigationRef.ts, Root.tsx, index.ts, navigation.ts, utils.ts, event.ts, hooks.ts, regLaunchedEvent.ts
src/utils/nativeModules/*.ts              # Harmony 工具/crypto/cache/桌面歌词及 userApi 适配
harmony/entry/src/main/ets/nativeModules/  # Utils/Crypto/TrackPlayer/BackgroundTimer + 包工厂
harmony/entry/src/main/cpp/LXMusicPackage.h # 原生模块 C++ 方法表及工厂
index.harmony.{smoke,player-smoke,crypto-smoke,userapi-smoke}.js # 真机验证入口
harmony/entry/src/main/ets/workers/UserApiWorker.ets # 音源独立线程
harmony/entry/src/main/cpp/{quickjs,userapi}/ # 引擎源码、NAPI 桥、离线测试与说明
docs/superpowers/plans/2026-10-10-lx-music-harmony-port.md   # 分阶段计划
.superpowers/sdd/2026-10-10-.../progress.md                  # 详细执行 ledger(gitignore)
```

### 其它注意
- `.npmrc`: `legacy-peer-deps=true`。
- `package.json`: RN 相关依赖已改 OH 版/vendor;`overrides`;`postinstall` 跑补丁脚本;`bundle-harmony*` scripts。
- 安卓端因移除 Wix RNN 已不可构建（本期 harmony-only,安卓非交付物）。
- 本机签名已由用户在 DevEco 配好；`harmony/build-profile.json5` 的签名配置属于本机凭据，不提交。
