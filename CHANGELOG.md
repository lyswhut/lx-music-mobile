# lx-music-desktop change log

All notable changes to this project will be documented in this file.

Project versioning adheres to [Semantic Versioning](http://semver.org/).
Commit convention is based on [Conventional Commits](http://conventionalcommits.org).
Change log format is based on [Keep a Changelog](http://keepachangelog.com/).

## [0.4.1](https://github.com/lyswhut/lx-music-mobile/compare/v0.4.0...v0.4.1) - 2021-05-30

### 修复

- 修复定时播放开启歌曲播放完毕再停止时，若倒计时已结束会导致无法播放歌曲的问题

## [0.4.0](https://github.com/lyswhut/lx-music-mobile/compare/v0.3.3...v0.4.0) - 2021-05-30

### 新增

- 新增我的列表中已收藏的在线列表的更新功能。注意：这将会覆盖本地的目标列表，歌曲将被替换成最新的在线列表（与PC端的同步一样）
- 歌曲添加、移动弹窗新增创建新列表功能
- 新增定时退出播放

### 优化

- 优化应用布局对手机系统字体大小的适配
- 调整歌单详情页，现在在歌单详情页按手机上的返回键将会返回歌单列表，而不是直接退出APP
- 优化进入播放详情页、歌单详情页的动画效果

### 修复

- 尝试修复某些情况下进播放详情歌词界面时报错的问题

## [0.3.3](https://github.com/lyswhut/lx-music-mobile/compare/v0.3.2...v0.3.3) - 2021-05-25

### 修复

- 尝试修复软件启动时恢复上一次播放的歌曲可能导致软件崩溃的问题
- 尝试修复播放详情页歌词导致UI冻结的问题
- 修复企鹅音乐搜索歌曲没有结果的问题

### 其他

- 整合日志记录
- 更新 exoPlayer 到 2.14.0

## [0.3.2](https://github.com/lyswhut/lx-music-mobile/compare/v0.3.1...v0.3.2) - 2021-05-23

### 修复

- 修复手机分享的wy歌单、某些tx、kg歌单无法打开的问题
- 修复打开空的歌单时，点击播放全部会导致应用崩溃的问题
- 修复企鹅音乐搜索歌曲没有结果的问题

## [0.3.1](https://github.com/lyswhut/lx-music-mobile/compare/v0.3.0...v0.3.1) - 2021-05-22

### 修复

- 修复进入播放详情歌词界面后的屏幕常亮不会被取消的问题

## [0.3.0](https://github.com/lyswhut/lx-music-mobile/compare/v0.2.0...v0.3.0) - 2021-05-22

### 新增

- 新增通过歌单链接打开歌单的功能

### 优化

- 切换到播放详情歌词界面时将阻止屏幕息屏

### 修复

- 修复一个导致崩溃日志写入文件前会导致APP崩溃的莫名其妙问题

## [0.2.0](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.7...v0.2.0) - 2021-05-21

### 新增

- 新增竖屏下的播放详情页

## [0.1.7](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.6...v0.1.7) - 2021-05-20

### 优化

- 修改歌单导入流程，添加对歌单导入错误的捕获

### 修复

- 修复在系统暗主题下，应用内文字输入框的字体会变成白色的问题

## [0.1.6](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.5...v0.1.6) - 2021-05-18

### 优化

- 改进软件错误处理，添加对软件崩溃的错误日志记录，可在设置-其他查看错误日志历史。注：清理缓存时日志也将会被清理

### 修复

- 修复显示版本更新弹窗会导致应用崩溃的问题

## [0.1.5](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.4...v0.1.5) - 2021-05-18

### 修复

- 修复修复协议弹窗可以被绕过的问题
- 修复从在线列表使用稍后播放功能播放歌曲时，歌曲封面不显示的问题
- 修复正在播放“稍后播放”的歌曲时，对“稍后播放”前播放的列表进行添加、删除操作会导致切歌的问题

## [0.1.4](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.3...v0.1.4) - 2021-05-16

### 修复

- 修复获取在线列表时快速切换会导致APP闪退的问题

## [0.1.3](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.2...v0.1.3) - 2021-05-16

### 优化

- 添加导入提示，兼容从PC端“全部数据”类型的备份文件中导入歌单
- 添加全局异常错误捕获，现在一般情况下APP崩溃前会弹窗提示错误信息。

## [0.1.2](https://github.com/lyswhut/lx-music-mobile/compare/v0.1.1...v0.1.2) - 2021-05-16

### 优化

- 在搜索、歌单、排行榜列表多选音乐后点菜单中的播放将会把已选的歌曲添加到试听列表播放

### 修复

- 修复播放模块没拉取最新代码导致播放器存在无法从通知栏停止等问题

## [0.1.1] - 2021-05-15

- v0.1.1版本发布 🎊 🎉
