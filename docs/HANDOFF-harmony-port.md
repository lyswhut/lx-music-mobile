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
- **当前所在**：正在解决「App 自带/自定义原生模块」。已把 `react-native-file-system`（自定义 fork）改为委托 `react-native-fs`；**最后一次打包失败**（见 §6），需先处理。
- **MVP 目标**（用户确认）：**自定义音源(QuickJS) + 搜索 + 播放**。桌面歌词、本地媒体元数据 **不做**。

### 已提交 commit（`git log d295604..HEAD`）
```
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
未提交：`vendor/react-native-file-system/src/index.ts`（fs 委托实现，见 §5）。

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
- **C-API 架构**：`harmony/entry/src/main/ets/pages/Index.ets` 的 `RNApp` 配 `enableCAPIArchitecture: true`——**这是 Phase 0 真机不崩的关键**（RNOH 0.72.144 旧 ArkTS 架构在 API26 的窗口接口会 SIGSEGV）。`arkTsComponentNames: []` 必填。
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
5. 个案：**screens** OH 版 JS 残缺 → `vendor/react-native-screens`（官方完整 JS + OH harmony 原生 + 合并 harmony 字段）；**fs** 纯 ArkTS 无 C++（只 ETS 注册）；**slider** 无 Package 类（排除）；**safe-area** ArkTS 用 `px2vp` 报错（**暂排除**,react-navigation 有 JS 回退)。
6. 装 OH 版要 `rm package-lock.json` 后再 `npm install`（否则 npm alias 不装）。装时用 `--legacy-peer-deps`（`.npmrc` 已设）。

---

## 5. 当前正在做：App 自带/自定义原生模块

RN 侧 `getEnforcing` 硬依赖已解决；现在是 `NativeModules.XxxModule`（undefined）类模块。真机 RedBox "Log x of 5" 显示若干未接入模块报错。

- **`react-native-file-system`（vendor fork）** → 已改为**委托 `react-native-fs`（OH 版）实现**（`vendor/react-native-file-system/src/index.ts`,未提交）。gzip 用 pako；AndroidScoped(SAF 文档树)降级为桩。**待这次构建成功后真机验证。**
- **项目自带 5 模块**（`src/utils/nativeModules/`,安卓在 `android/.../cn/toside/music/mobile/`）：
  | 模块 | NativeModules 名 | 用途 | 处置 |
  |---|---|---|---|
  | `utils.ts` | UtilsModule | 状态栏/窗口尺寸/退出/通知权限/电池优化/息屏 | **重写**（ArkTS）——init 就用,优先 |
  | `cache.ts` | CacheModule | 缓存清理 | 重写(简单)或桩 |
  | `crypto.ts` | CryptoModule | AES/RSA | 重写（鸿蒙 cryptoFramework）——自定义音源要 |
  | `userApi.ts` | UserApiModule | **QuickJS 跑自定义音源脚本** | 重写（QuickJS NAPI）——MVP 核心,最难 |
  | `lyricDesktop.ts` | LyricModule | 桌面歌词 | **桩**（本期不做） |
  > 注意 `utils.ts` 等在**模块顶层**就 `UtilsModule.exitApp` 取属性,undefined 会 import 崩。重写需提供 ArkTS TurboModule,或先做 JS 安全桩让 import 不崩、再逐个实现。

---

## 6. ⚠️ 立即要处理的：最后一次构建失败

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

1. **修 §6 构建** → 真机验证 fs 委托 + 看 RedBox 还剩哪些模块错。
2. **重写 App 自带原生模块**（§5 表）：先 `utils`（让 init 过）→ `crypto` → `userApi`（QuickJS,MVP 核心）→ `cache`；`lyricDesktop` 桩。
3. **搜索 + 播放链路**（Phase 2）：`track-player` 用 OH 移植版(4.1.2)+ 合入 lyswhut fork 定制(fork 实为 2.x,API 有差异);后台播放用 AVSession。
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
  react-native-file-system/src/index.ts   # ★改为委托 react-native-fs(未提交)
  react-native-{track-player,background-timer,local-media-metadata}/
src/navigation/                           # 全部重写为 react-navigation(对外 API 不变)
  navigationRef.ts, Root.tsx, index.ts, navigation.ts, utils.ts, event.ts, hooks.ts, regLaunchedEvent.ts
src/utils/nativeModules/*.ts              # 待重写(§5)
docs/superpowers/plans/2026-10-10-lx-music-harmony-port.md   # 分阶段计划
.superpowers/sdd/2026-10-10-.../progress.md                  # 详细执行 ledger(gitignore)
```

### 其它注意
- `.npmrc`: `legacy-peer-deps=true`。
- `package.json`: RN 相关依赖已改 OH 版/vendor;`overrides`;`postinstall` 跑补丁脚本;`bundle-harmony*` scripts。
- 安卓端因移除 Wix RNN 已不可构建（本期 harmony-only,安卓非交付物）。
- 签名已由用户在 DevEco 配好（`harmony/build-profile.json5` signingConfigs）。
