# Harmony 移植架构

打开 `harmony-rnoh.excalidraw` 可在 Excalidraw 中编辑各组件与连线；`harmony-rnoh.svg` 为完整预览。

图按本仓库的实际实现绘制，重点区分：

- Metro 负责打包和平台实现选择，RNOH 负责运行 RN 与桥接原生能力。
- Fabric / ComponentInstance 将 RN 界面转换为 ArkUI 节点，并将触摸事件送回 JS。
- JS 的 TurboModuleRegistry 通过 JSI 进入 C++ 方法表，再由 RNOH 调度到 ArkTS UITurboModule，最终调用 Harmony SDK。
- Promise 和 DeviceEventEmitter 分别承载方法结果与原生事件。
- 自定义音源由 Worker 中的 QuickJS 执行，与 RN 的 JS 运行时分开；通过消息与 NAPI 连接宿主能力。

相关注册入口：`index.harmony.js`、`harmony/entry/src/main/ets/pages/Index.ets`、ETS 与 C++ 的 `PackageProvider`、`nativeModules/LXMusicPackage.ets` 和 `cpp/LXMusicPackage.h`。

修改后运行 `node scripts/generate-harmony-architecture.mjs` 可重新生成两个图文件。
