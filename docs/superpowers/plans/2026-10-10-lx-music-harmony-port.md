# lx-music 鸿蒙移植 实施计划（Harmony Port Implementation Plan）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 lx-music-mobile（React Native 安卓端）移植为 HarmonyOS NEXT 版本，最小可用目标 = **自定义音源 + 在线搜索 + 播放（含后台播放）** 三件套跑通。

**Architecture:** 用 **RNOH（React Native for OpenHarmony）** 承载现有 `src/` 里的 RN JS 业务代码（界面/状态/业务逻辑基本复用）。RN 版本从 0.73.11 **回退到 0.72.x** 以对齐 RNOH 成熟线。第三方原生依赖：**优先用 `@react-native-oh-tpl/*` 官方移植版**；无移植的（Wix 导航、vector-icons、quick-md5）替换或自行移植；项目自带的 5 个原生模块（`cn/toside/music/mobile/*`）中，MVP 需要的用 ArkTS/C++ 重写，不需要的（`lyric` 桌面歌词、本地媒体元数据）**本期不做**。

**Tech Stack:** React Native 0.72.x · RNOH `@react-native-oh/react-native-harmony` 0.72.144 · ArkTS / ArkUI · C++(NAPI) · DevEco Studio(HarmonyOS NEXT, API modelVersion 6.1.0) · hvigor 构建 · QuickJS(C 库，用于自定义音源沙箱)

**Spec / 设计依据:** 本仓库内无独立 spec 文件；设计依据为移植前的逐依赖实测调研结论，完整记录在会话记忆 `lx-music-harmony-port`（含 RN 版本对齐判断、22 个依赖的 npm 移植状态实测、5 个原生模块规模与去留）。本计划所有版本号/包名均来自对 npm registry 的实测。

---

## Global Constraints（全局约束 · 每个任务都隐含遵守）

- **RN 版本地板：0.72.x**（RNOH 无 0.73 版；全部第三方 OH 移植库针对 0.72 线编译）。目标 RNOH：`@react-native-oh/react-native-harmony@0.72.144`。
- **应用包名保持 `cn.toside.music.mobile`**（与安卓端一致，便于数据/配置迁移心智）。
- **`harmony/` 目录是本地未跟踪产物**（远端 `master` 无此目录）。**禁止 `git clean -fdx`**（项目自带的 `clear:full` 脚本会执行它——不要跑）。拉远端代码用 `git pull`/`fetch`，不碰未跟踪文件。
- **github.com 在本机被墙**：所有 RN/鸿蒙依赖从 npm registry、ohpm.openharmony.cn 拉取；RNOH 文档查 gitee `openharmony-sig/ohos_react_native` 或 gitcode 同名仓（均可达）。需要 github 的操作（原依赖里的 `github:lyswhut/...` fork）改为本地放置或从 CDN 镜像。
- **本期不做：** 桌面悬浮歌词（`lyric` 模块）、本地歌曲媒体元数据（`react-native-local-media-metadata`）。相关入口可保留但走降级/占位，不得因其缺失导致崩溃。
- **每个任务结束必须能独立验证 + 提交一次 commit。** commit message 用中文、延续项目现有风格（如 `feat:`/`fix:` 前缀可选）。

## Review Focus（spec 隐含、但最易咬人的点 · 已在对应任务补测）

1. **自定义音源脚本执行超时/死循环**——用户脚本跑在 QuickJS 里，若无超时保护会卡死播放线程。Task 3.2 的测试需覆盖"脚本 5s 未返回则中止并报错"。
2. **后台播放被系统回收**——鸿蒙对长时任务管控严格，未正确申请 `AVSession` + 后台任务权限会导致切到后台音乐就停。Task 2.3 需在真机验证"锁屏后继续播放 ≥60s"。
3. **搜索返回空/网络异常**——搜索接口超时或返回非预期结构时应给出空列表+提示，而非崩溃。Task 1.4 补测"网络 5xx / 超时 / 空结果"三种输入。
4. **md5 替换后哈希不一致**——`quick-md5` 换实现后，若对同一输入产出与安卓端不同的 md5，会导致音源签名/缓存键错乱。Task 3.4 补测"已知字符串→已知 md5"黄金用例。
5. **config/用户数据读写路径**——鸿蒙沙箱路径与安卓不同，`fs` 迁移后若配置读不到会丢用户设置。Task 1.3 补测"写入后重启读回一致"。

---

# Phase 0 — 版本对齐与 RNOH 骨架

> 目标产物：`harmony/` 工程集成 RNOH，能在模拟器/真机上渲染一个由 `src` 之外的最小 RN 入口画出的页面（"Hello from RN on Harmony"）。此阶段是集成/配置性质，验证方式为"能构建、能启动、能看到 RN 画面"，不是单元测试。

### Task 0.1：RN 版本回退到 0.72.x

**Files:**
- Modify: `package.json`（`react-native` 0.73.11 → 目标 0.72.x；`react` 对应版本；相关 `@react-native/*` 工具链）
- Modify: `package-lock.json`（重新生成）
- Test: 构建冒烟（`npm run start` + 安卓跑通，确保回退没砸掉现有安卓端）

**Interfaces:**
- Produces: 一个 RN 0.72.x 可正常构建运行的 JS 工程基线，供后续所有阶段使用。

- [ ] **Step 1：锁定目标 RN 0.72.x 精确版本**。查 RNOH 0.72.144 对应的 RN 补丁版本（RNOH 文档的"版本配套表"，gitee `openharmony-sig/ohos_react_native` 的 docs）。记录到本任务。
- [ ] **Step 2：改 `package.json`** 的 `react-native` 与配套 `@react-native/metro-config`、`@react-native/babel-preset` 等到 0.72 线；`react` 保持 18.2.0（0.72 兼容）。
- [ ] **Step 3：删 `node_modules` 与 lock，重装**：`rm -rf node_modules package-lock.json && npm install`。
- [ ] **Step 4：安卓冒烟回归**——`npm run dev`（run-android），确认现有安卓端仍能启动到首页。这是"回退没有破坏现有端"的验证。
  - Expected：安卓 App 正常起来、能进主界面。
- [ ] **Step 5：Commit** —— `chore: 回退 RN 到 0.72.x 以对齐 RNOH`。

> ⚠️ 若发现 `src` 中使用了 0.73 独有 API（构建报错处逐个定位），在本任务内一并降级适配，记录清单。

### Task 0.2：harmony/ 工程接入 RNOH 运行时

**Files:**
- Modify: `harmony/oh-package.json5`（根，加 `@rnoh/react-native-openharmony` 依赖）
- Modify: `harmony/entry/oh-package.json5`、`harmony/entry/src/main/ets/pages/Index.ets`、`entryability/EntryAbility.ets`
- Create: `harmony/entry/src/main/cpp/*`（RNOH C++ 入口：`CMakeLists.txt`、`PackageProvider.cpp` 等，按官方模板）
- Create: `harmony/entry/src/main/ets/RNPackagesFactory.ets` 或等价 RNOH 包注册点

**Interfaces:**
- Produces: 一个能加载 RN bundle 并挂载 `RNApp`/`RNSurface` 的鸿蒙 Ability。

- [ ] **Step 1：按 RNOH 官方"创建工程/集成到已有工程"指南**（gitee `openharmony-sig/ohos_react_native` → docs 集成章节；本机可达）把 RNOH 依赖写入 `harmony` 工程的 ohpm 依赖并 `ohpm install`。使用 Global Constraints 锁定的 RNOH 0.72.144。
- [ ] **Step 2：替换默认 `Index.ets`** 为挂载 RNOH Surface 的页面（`RNApp` + `RNInstance`），`EntryAbility` 初始化 RNInstanceManager。
- [ ] **Step 3：建立 C++ 侧** `cpp/` 目录与 `CMakeLists.txt`（引入 RNOH 预编译产物），`build-profile.json5` 打开 native 构建。
- [ ] **Step 4：构建**——DevEco 里 `hvigor assembleHap`（或命令行 `hvigorw`），确认编译通过。
  - Expected：`.hap` 产物生成、无 native 链接错误。
- [ ] **Step 5：Commit** —— `feat(harmony): 接入 RNOH 运行时骨架`。

### Task 0.3：打通 harmony 的 RN bundle 构建链路 + 渲染最小 RN 页面

**Files:**
- Create: `harmony/entry/src/main/resources/rawfile/bundle.harmony.js`（构建产物落点，或按 RNOH 约定路径）
- Create: `index.harmony.js`（临时最小入口，渲染一行文字，**不引入 `src`**，先验证链路）
- Modify: `metro.config.js`（增加 harmony platform 解析，接入 `@react-native-oh/react-native-harmony` 的 metro 插件）

**Interfaces:**
- Consumes: Task 0.2 的 RNOH Surface。
- Produces: 可重复执行的"打 harmony bundle → 放入工程 → 运行"流程，后续阶段换成真实 `index.js` 入口即可。

- [ ] **Step 1：写最小入口** `index.harmony.js`：注册一个只渲染 `<Text>Hello from RN on Harmony</Text>` 的组件（AppRegistry）。
- [ ] **Step 2：配置 metro** 的 harmony 平台与 RNOH metro 插件（参考 RNOH 文档 metro 段），加 npm script：`bundle-harmony`（platform=harmony，entry=index.harmony.js，输出到 rawfile）。
- [ ] **Step 3：打 bundle** 并放入 harmony 工程 rawfile。
- [ ] **Step 4：真机/模拟器运行**——安装 `.hap`，确认屏幕显示 "Hello from RN on Harmony"。
  - Expected：看到 RN 渲染的文字（而非默认 Hello World ArkUI 页）。这是整个移植"路线成立"的里程碑。
- [ ] **Step 5：Commit** —— `feat(harmony): 打通 RN bundle 构建与渲染链路`。

---

# Phase 1 — 官方移植库接入 · 导航替换 · 主界面跑通

> 目标产物：用真实 `index.js`（全量 `src` 业务）起 App，主界面框架能显示（可能部分功能报错），导航可用。

### Task 1.1：切换到真实入口并接入"纯 JS 依赖 + 官方移植库"

**Files:**
- Modify: `harmony/oh-package.json5`（加入官方移植库的 **native 侧** 包）
- Modify: `package.json`（JS 侧依赖改指向 `@react-native-oh-tpl/*` 或通过 overrides 映射）
- Modify: RNOH 包注册点（`RNPackagesFactory.ets` / C++ `PackageProvider`）注册各库的 OH Package
- Modify: metro 入口改回 `index.js`

**Interfaces:**
- Consumes: Phase 0 的构建链路。
- Produces: async-storage/clipboard/slider/pager-view/fs/exception-handler/quick-base64/background-timer 在鸿蒙可用。

- [ ] **Step 1：逐个加入官方移植版**（实测存在的精确版本）：
  - `@react-native-oh-tpl/async-storage@1.21.0-0.2.2`
  - `@react-native-oh-tpl/clipboard@1.13.2-0.0.9`
  - `@react-native-oh-tpl/slider@4.4.3-0.3.4`
  - `@react-native-oh-tpl/react-native-fs@2.20.0-0.1.14`
  - `@react-native-oh-tpl/react-native-pager-view@6.2.3-0.2.8`
  - `@react-native-oh-tpl/react-native-background-timer@2.4.1-0.0.2`
  - `@react-native-oh-tpl/react-native-exception-handler@2.10.10-0.1.7`
  - `@react-native-oh-tpl/react-native-quick-base64@2.1.2-1.0.1`
  用 `package.json` 的 `overrides`（或 `resolutions`）把原包名映射到 OH 版，JS 侧 import 不改。
- [ ] **Step 2：在 RNOH 包注册点注册**每个库的 native Package（ArkTS + C++ 两侧，按各库 README）。
- [ ] **Step 3：ohpm install + 打 bundle + 构建**。
- [ ] **Step 4：验证**——起 App，确认 native 模块注册无"module not found"报错（此时导航未替换，可能白屏/报导航错，属正常，下个任务修）。
- [ ] **Step 5：Commit** —— `feat(harmony): 接入官方移植的原生依赖`。

### Task 1.2：用 react-navigation 替换 Wix react-native-navigation

**Files:**
- Modify: 所有使用 `react-native-navigation` 的 `src/` 文件（导航注册、push/pop、Modal、Tab）
- Create: `src/navigation/`（新的 react-navigation 容器/路由定义，如不存在）
- Modify: `package.json`（移除 `react-native-navigation`，加入 `@react-navigation/native` + 所需 navigator + `react-native-screens`(OH 版若有)/`react-native-safe-area-context`(OH 版)）
- Test: `src/navigation/__tests__/`（路由映射单测）

**Interfaces:**
- Consumes: RN 基础环境。
- Produces: 统一的导航 API（`navigate(routeName, params)` / `goBack()`），替换全项目 RNN 调用。

- [ ] **Step 1：盘点 RNN 用法**——`grep -rn "react-native-navigation" src/` 列出所有调用点（页面注册、`Navigation.push`、`showModal`、options/topBar 配置、事件监听）。产出映射表。
- [ ] **Step 2：写路由定义的失败测试**——`src/navigation/__tests__/routes.test.ts`：断言每个安卓端存在的屏幕名都能在新路由表中解析到对应组件。
- [ ] **Step 3：运行测试确认失败**（路由表未建）。
- [ ] **Step 4：搭 react-navigation 容器**——NavigationContainer + Stack/Tab，按映射表注册全部屏幕；RNN 的 topBar/options 转为 react-navigation 的 `screenOptions`。
- [ ] **Step 5：逐调用点替换** `Navigation.push/pop/showModal` → `navigation.navigate/goBack/present`。
- [ ] **Step 6：运行路由测试确认通过**。
- [ ] **Step 7：鸿蒙 + 安卓双端起 App 验证主界面可进、Tab 可切、能前进后退**。
- [ ] **Step 8：Commit** —— `refactor: 用 react-navigation 替换 Wix 原生导航`。

> ⚠️ 这是波及面最大的改动。按屏幕分批替换、每批可单独 commit；本 Task 可按 navigator 维度拆成多个子 Task 执行。

### Task 1.3：config/用户数据存储在鸿蒙的读写验证

**Files:**
- Modify: `src/` 中封装 fs/async-storage 的存储层（定位实际读写配置的模块）
- Test: 存储层读写往返测试

**Interfaces:**
- Produces: 鸿蒙沙箱下可靠的"写入→重启→读回一致"的配置存储。

- [ ] **Step 1：写失败测试**——对存储层封装：写入一个 settings 对象，模拟重启后读回，断言深相等。
- [ ] **Step 2：运行确认失败/或在鸿蒙真机手测发现路径问题**。
- [ ] **Step 3：修正鸿蒙沙箱路径**（`react-native-fs` OH 版的 DocumentDirectoryPath 等常量在鸿蒙的取值），确保存储层用的是可写沙箱目录。
- [ ] **Step 4：运行测试确认通过 + 真机验证**改设置→杀进程→重进，设置保留。（覆盖 Review Focus #5）
- [ ] **Step 5：Commit** —— `fix(harmony): 适配鸿蒙沙箱配置读写路径`。

### Task 1.4：在线搜索链路跑通（含异常输入）

**Files:**
- Modify: 搜索相关 `src/` 业务（网络请求层若用到 native fetch/okhttp 行为差异）
- Test: 搜索结果解析与异常处理测试

**Interfaces:**
- Consumes: 导航、存储。
- Produces: 搜索框输入关键词→展示结果列表的完整可用链路。

- [ ] **Step 1：写失败测试**——给定 mock 的搜索响应（正常/5xx/超时/空结果），断言：正常→列表项解析正确；5xx→抛出可捕获错误；超时→不卡死；空→返回空列表+UI 提示标志。（覆盖 Review Focus #3）
- [ ] **Step 2：运行确认失败**。
- [ ] **Step 3：实现/适配**搜索结果处理与错误分支（RN 的 `fetch` 在 RNOH 可用，重点是超时与异常不崩）。
- [ ] **Step 4：测试通过 + 鸿蒙真机手测**搜一个关键词看到结果。
- [ ] **Step 5：Commit** —— `feat(harmony): 跑通在线搜索链路`。

---

# Phase 2 — 播放链路（track-player）🎯 MVP 核心

### Task 2.1：接入 track-player 鸿蒙移植版并合入 fork 定制

**Files:**
- Modify: `package.json`（原 `github:lyswhut/react-native-track-player#...` → 用 `@react-native-oh-tpl/react-native-track-player@4.1.2` 做 native，JS 侧用对应 4.x API；通过 overrides 映射）
- Modify: `harmony/oh-package.json5` + RNOH 包注册点（注册 TrackPlayer OH Package）
- Create: `doc/track-player-fork-diff.md`（记录 lyswhut fork 相对上游 4.x 的定制点清单）

**Interfaces:**
- Produces: `TrackPlayer.setupPlayer/add/play/pause/seekTo/getState` 等在鸿蒙可用。

- [ ] **Step 1：取出 fork 定制清单**——对比 `lyswhut/react-native-track-player` fork 与上游 4.x，列出被改的行为（lx 常见定制：自定义请求头、本地/在线混合、特殊 metadata）。从本地 `node_modules` 现有 fork 源码比对（github 墙，不从远端拉）。产出 diff 文档。
- [ ] **Step 2：接入 OH 版 4.1.2**，JS 侧按 4.x API 调整（fork 若基于更早版本，核对 API 变更）。
- [ ] **Step 3：注册 native Package + 构建**。
- [ ] **Step 4：验证**——鸿蒙真机：加载一首可直链播放的音频，`play()` 出声。
- [ ] **Step 5：Commit** —— `feat(harmony): 接入 track-player 鸿蒙移植版`。

### Task 2.2：搜索→解析→播放 端到端打通

**Files:**
- Modify: 连接"搜索结果项→获取播放 URL→送入 TrackPlayer"的 `src/` 业务
- Test: 播放队列构建测试（`buildTracks` 相关——项目 CHANGELOG 提到过该函数）

**Interfaces:**
- Consumes: Task 1.4 搜索、Task 2.1 播放器。
- Produces: 点搜索结果即可播放的闭环。

- [ ] **Step 1：写失败测试**——给定一个搜索结果项，`buildTracks` 产出符合 TrackPlayer 入队结构（url/title/artist/artwork 字段齐全）。
- [ ] **Step 2：运行确认失败**。
- [ ] **Step 3：实现/适配**取流与入队逻辑。
- [ ] **Step 4：测试通过 + 真机手测**：搜索→点歌→播放→暂停→切歌。
- [ ] **Step 5：Commit** —— `feat(harmony): 打通搜索到播放端到端链路`。

### Task 2.3：后台播放 + 锁屏/通知控制（AVSession）

**Files:**
- Modify: harmony 工程 `module.json5`（后台长时任务 `backgroundModes: audioPlayback`、相关权限）
- Modify: track-player OH 侧 / 自建桥接，确保接入鸿蒙 `AVSession`（媒体会话：锁屏控制、通知栏、音频焦点）
- Modify: `utils` 相关（通知权限申请——见 Task 3.5）

**Interfaces:**
- Produces: 切后台/锁屏持续播放，系统媒体控件可暂停/切歌。

- [ ] **Step 1：在 `module.json5` 申请**后台音频长时任务与音频权限。
- [ ] **Step 2：确认 OH track-player 是否已集成 AVSession**；若未覆盖 lx 需求，补桥接（播放态上报 AVSession、响应控制命令）。
- [ ] **Step 3：真机验证**（覆盖 Review Focus #2）：播放→锁屏→等待 ≥60s 仍在放；锁屏界面点暂停/下一首生效。
- [ ] **Step 4：Commit** —— `feat(harmony): 后台播放与锁屏媒体控制`。

> **到此 = 能搜能放的可用版本**（自定义音源尚未接入，但官方/内置音源可用）。

---

# Phase 3 — 自定义音源（QuickJS）· 加解密 · 依赖替换

### Task 3.1：在鸿蒙侧嵌入 QuickJS 引擎（native 基建）

**Files:**
- Create: `harmony/entry/src/main/cpp/quickjs/`（QuickJS C 源码 + CMake 接入）
- Create: `harmony/entry/src/main/cpp/UserApiModule.cpp`（NAPI 封装：创建 JS 运行时、执行脚本、超时中断、回调桥）
- Modify: `CMakeLists.txt`

**Interfaces:**
- Produces: native 能力：`evalUserScript(code, input) -> result`，带超时与沙箱隔离。

- [ ] **Step 1：把 QuickJS 源码放入 cpp/**（从 QuickJS 官方发布包本地放置，不走 github）。
- [ ] **Step 2：CMake 编译 QuickJS** 为 native 库，`hvigor` 构建通过（纯编译验证）。
- [ ] **Step 3：写 NAPI 导出** `evalUserScript`：创建 `JSRuntime`/`JSContext`，设置执行超时中断钩子（`JS_SetInterruptHandler`），执行后销毁。
- [ ] **Step 4：构建验证** native 库链接成功、符号导出。
- [ ] **Step 5：Commit** —— `feat(harmony): 嵌入 QuickJS native 引擎`。

### Task 3.2：userApi 模块的 ArkTS/RNOH 封装 + 超时保护

**Files:**
- Create: harmony 侧 `UserApi` RNOH TurboModule（ArkTS，桥接到 Task 3.1 的 native）
- Modify: `src/` 中调用 userApi 的业务（保持原 JS 接口签名，对标安卓 `UserApiModule`）
- Test: 自定义音源执行测试（正常脚本 / 死循环脚本 / 抛错脚本）

**Interfaces:**
- Consumes: Task 3.1 `evalUserScript`。
- Produces: 与安卓端 `UserApiModule` 等价的 JS 接口（加载音源脚本、调用脚本的搜索/取流方法、事件回调）。

- [ ] **Step 1：写失败测试**（覆盖 Review Focus #1）：
  - 正常音源脚本→返回预期结构；
  - 死循环脚本→5s 内被中断并抛 timeout 错误（不卡死）；
  - 抛异常脚本→错误被捕获上报。
- [ ] **Step 2：运行确认失败**。
- [ ] **Step 3：实现 TurboModule**：对标安卓 `userApi/`（`UserApiModule`/`JsHandler`/`JavaScriptThread`）的接口与事件（`UtilsEvent`），在独立线程执行、超时中断。
- [ ] **Step 4：测试通过 + 真机**：导入一个真实自定义音源，能用它搜索到结果。
- [ ] **Step 5：Commit** —— `feat(harmony): 自定义音源 QuickJS 执行模块`。

### Task 3.3：crypto 模块（AES/RSA）重写

**Files:**
- Create: harmony 侧 `Crypto` RNOH 模块（ArkTS，用 `@kit.CryptoArchitectureKit` cryptoFramework）
- Modify: `src/` 调用点（接口对标安卓 `crypto/CryptoModule`：AES 加解密、RSA）
- Test: 加解密往返 + 与安卓端同输入同输出的黄金用例

**Interfaces:**
- Produces: `aesEncrypt/aesDecrypt/rsaEncrypt` 等，输出需与安卓端字节级一致（音源常依赖）。

- [ ] **Step 1：写失败测试**——已知明文+密钥→已知密文（从安卓端跑一组黄金值固化）；AES 加密再解密往返一致。
- [ ] **Step 2：运行确认失败**。
- [ ] **Step 3：用鸿蒙 cryptoFramework 实现** AES（模式/padding 与安卓 `AES.java` 对齐）与 RSA（`RSA.java` 对齐）。
- [ ] **Step 4：测试通过**（字节级一致是关键）。
- [ ] **Step 5：Commit** —— `feat(harmony): 重写 AES/RSA 加解密模块`。

### Task 3.4：替换 quick-md5

**Files:**
- Modify: `package.json`（移除 `react-native-quick-md5`）
- Modify: `src/` 中 md5 调用点（改用纯 JS md5 库，或封装到 Task 3.3 的 crypto 模块用 cryptoFramework 的 MD5）
- Test: md5 黄金用例

**Interfaces:**
- Produces: `md5(string) -> hex`，与安卓端一致。

- [ ] **Step 1：写失败测试**（覆盖 Review Focus #4）：`md5("lx-music")` 等已知输入→已知 32 位 hex（黄金值取自安卓端）。
- [ ] **Step 2：运行确认失败**。
- [ ] **Step 3：实现**——优先用 cryptoFramework 的 MD5（native，快）；否则纯 JS `blueimp-md5`。
- [ ] **Step 4：测试通过**。
- [ ] **Step 5：Commit** —— `refactor: 替换 quick-md5`。

### Task 3.5：utils 模块（通知/权限）按 MVP 需要重写

**Files:**
- Create: harmony 侧 `Utils` RNOH 模块（通知权限申请、必要的系统交互）
- Modify: `src/` 调用点（对标安卓 `utils/UtilsModule`，**仅实现 MVP 需要的**：通知权限——播放通知需要；电池优化提示可降级为 no-op）
- Test: 接口存在性/降级行为测试

**Interfaces:**
- Produces: 通知权限申请 API；不支持的能力安全降级（返回 false/no-op，不崩）。

- [ ] **Step 1：写失败测试**——调用未实现能力时返回安全降级值而非抛错；通知权限接口可调用。
- [ ] **Step 2：运行确认失败**。
- [ ] **Step 3：实现**通知权限申请（鸿蒙通知 Kit），其余安卓特有项（`BatteryOptimizationUtil` 等）降级为 no-op 并注释说明本期不做。
- [ ] **Step 4：测试通过 + 真机**：首次播放能弹通知权限、通知栏有播放通知。
- [ ] **Step 5：Commit** —— `feat(harmony): utils 通知与权限（MVP 子集）`。

### Task 3.6：cache 模块 + 图标方案

**Files:**
- Create: harmony 侧 `Cache` RNOH 模块（缓存清理，对标 `cache/CacheModule`，208 行，直接重写）
- Modify: `react-native-vector-icons` 的鸿蒙可用方案（字体随包打入 + 配置字体加载；或替换为等价图标方案）
- Test: 缓存清理返回值测试

**Interfaces:**
- Produces: 缓存清理 API；图标正常显示。

- [ ] **Step 1：重写 cache**——清理鸿蒙缓存目录，返回清理大小。
- [ ] **Step 2：图标**——确认 vector-icons 在 RNOH 的可行路径（字体文件打入 rawfile + 自定义 Text 字体），或改用图标字体替代方案；真机确认图标不是豆腐块。
- [ ] **Step 3：验证 + Commit** —— `feat(harmony): 缓存清理与图标显示`。

---

# Phase 4 — 打包与发布

### Task 4.1：签名、打包 .hap、整体联调

**Files:**
- Modify: `harmony/build-profile.json5`（签名配置：证书/profile）
- Create: `harmony/signing/`（签名材料，**不入 git**，加 `.gitignore`）

- [ ] **Step 1：配置签名**（DevEco 自动签名或手动证书）。
- [ ] **Step 2：Release 打包** `.hap`（`hvigorw assembleHap --mode module -p product=default -p buildMode=release`）。
- [ ] **Step 3：全流程真机验收**——按三件套走查：①导入自定义音源并搜索 ②在线搜索 ③播放+后台+锁屏控制。逐项打勾。
- [ ] **Step 4：Commit** —— `chore(harmony): 发布打包配置`。

---

## 附：明确不在本期范围（防止执行时误扩张）

- `lyric` 桌面悬浮歌词（安卓 1942 行 + 系统悬浮窗）——**不做**。相关入口降级隐藏，不得崩溃。
- `react-native-local-media-metadata` 本地歌曲元数据/封面——**不做**。
- 完整功能对等（歌单管理高级项、同步、换肤细节等）——本期以三件套可用为准，超出的记录到后续迭代。

## 执行注意（来自全局约束，再强调）
- 每次需要远端代码：`git pull`，**绝不 `git clean -fdx`**（`harmony/` 未跟踪，会被清掉）。
- 依赖一律走 npm/ohpm/CDN，github 被墙。
- track-player / background-timer / file-system 的 lyswhut fork 定制，从**本地 node_modules 现有源码**比对，不从 github 拉。
