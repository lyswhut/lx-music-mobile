# LX Music 原生 Android

基于原项目迁移的 Kotlin 音乐应用。界面、播放、存储和后台同步均由原生 Android 实现，React Native 源码、桥接工程和 Node 工具链已在功能回归通过后移除。

- 本地音乐与歌曲信息编辑，五平台搜索、排行榜、歌单分类、推荐和评论。
- 自定义音源、播放队列、缓存、离线重播、下载、分享和外部入口。
- 逐字歌词、译文/罗马音、桌面歌词、倍速、音量、定时停止和媒体控制。
- 歌单和不喜欢列表双向同步；退到后台或销毁界面后仍可同步，断网后重试并保留未确认操作。
- 旧版歌单备份导入/导出，16 套主题，简体/繁体/英文，原生更新下载与安装前校验。
- 手机分页与平板侧栏自适应布局，平板歌曲分列、封面与歌词并排显示，两端共用主题及同步设置样式。

在线歌曲播放和下载需要导入兼容的自定义音源。

## 构建与验证

使用 JDK 17、Android SDK 36；最低 Android 9。无需 Node 或 npm：

```powershell
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

在仓库根目录执行以上命令。调试包：`app/build/outputs/apk/debug/app-debug.apk`。

Android 12 真机已完成 145 项设备测试（含五平台 60 个联网分项）、14 项 JVM 单元测试，均通过；Debug/Release Lint 均无错误。已验证临时签名 Release 构建，以及同签名 APK 覆盖升级后私有数据保留。其他系统版本、硬件卸载、蓝牙终端和全部第三方脚本不在此次实测覆盖内。

- [使用与开发说明](DEVELOPMENT.md)
- [迁移功能对照](MIGRATION.md)
- [测试记录与复现命令](VALIDATION.md)
- [原生签名和发布](RELEASING.md)
- [常见问题](FAQ.md)

原生应用 ID 为 `cn.toside.music.nativeapp`，可与旧版并存。旧版私有数据不会自动转入，请使用歌单备份或 LX 同步服务迁移。

## 来源与许可

原项目：[lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile)。保留原项目的 [Apache 2.0 许可](LICENSE)、资源和项目使用协议；协议可在首次启动及「关于与版本」中查看。QuickJS 自定义音源脚本属于业务功能，独立于 React Native，已保留。

JAudiotagger、简繁字表等第三方许可及源码链接保存在原生工程资源和关于页面中。旧版更新历史保留在 [CHANGELOG.md](CHANGELOG.md)。
