# PROTOTYPE_PARTS —— new_design/parts 拆件校验清单

> 本文件由 `scripts/gen-newui-parts.mjs` 重写（派生，勿手改）。件本体在 `new_design/parts/`。
> 边界依据：`src/newui/PROTOTYPE_INVENTORY.md`（双向对撞报告）。

## 无损校验数字（本次生成实测，运行时断言）

- index.html 元素：原件 **1783** = 各件持有之和 **1783**（重复 0 / 丢失 0 / 无归属 0）。
- styles.css 规则：原件 **776** 条 = 各件收纳之和 **776**；选择器 **808** 个，逐条唯一归属（@media 3 块整体归 _chrome，@keyframes 按登记表归属）。
- app.js：只读；件头注释的符号行号在运行时实探，符号缺失即报错退出。
- 四个原型文件（index.html / styles.css / app.js / data.js）零改动。

## 件清单

| 单元 | 件（相对 parts/） | 持有元素 | 收纳规则 | 一句话 |
|---|---|---|---|---|
| 壳层 | `_shell` | 16 | 5 | 文档壳与页面骨架：html/head/body、#viewport、五只 .page |
| V1–V4 | `_chrome` | 1226 | 214 | 查看器 chrome |
| U01 | `common-control/topbar` | 12 | 9 | .topbar 吸顶头部 |
| U02 | `common-control/icon-btn` | 0 | 0 | .icon-btn 圆钮原子 |
| U03 | `common-control/pulse-dot` | 0 | 3 | .pulse-dot 音源告警呼吸点 |
| U04 | `common-control/tabbar` | 21 | 10 | .tabbar / .tab 底部 Tab |
| U05 | `common-control/minibar` | 18 | 43 | .minibar 迷你播放条 |
| U06 | `common-control/toast` | 1 | 2 | .toast 全站单例提示 |
| U07 | `common-control/art` | 0 | 0 | .art 程序化封面原子 |
| U08 | `common-control/chip` | 0 | 0 | .chip 胶囊原子 |
| U09 | `common-control/section` | 0 | 0 | .section / .section-head 区块壳 |
| U10 | `common-control/foot-note` | 9 | 0 | .foot-note 页尾说明 |
| U11 | `common-control/empty-tip` | 3 | 0 | .empty-tip 空态 |
| U12 | `common-control/ghost-btn` | 0 | 0 | .ghost-btn 幽灵按钮原子 |
| U13 | `common-control/play-badge` | 0 | 0 | .play-badge 封面播放角标原子 |
| U14 | `common-control/q-tag` | 0 | 0 | .q-tag 音质/时长小标签原子 |
| U15 | `common-control/src-badge` | 0 | 0 | .src-badge 平台来源角标原子 |
| U16 | `common-control/hscroll-recent` | 7 | 7 | .hscroll + .recent-card 继续收听横滚 |
| U17 | `common-control/sheet-chrome` | 0 | 14 | .sheet 浮层 chrome 定义 |
| U18 | `common-control/group-label` | 0 | 8 | .group-label 浮层分组标题 |
| U19 | `common-control/opt-list` | 0 | 22 | .opt-list / .opt-row |
| U20 | `common-control/op-box` | 0 | 12 | .op-box / .op-input / .op-go / .op-err / .op-file 输入行族 |
| U21 | `common-control/q-chips` | 0 | 2 | .q-chips |
| U22 | `common-control/toggle` | 0 | 4 | .toggle / .sw-row 开关行唯一定义 |
| U23 | `common-control/sprite` | 104 | 1 | SVG sprite |
| U30 | `common-control/eq-bars` | 0 | 5 | .sr-title .eq 播放中三柱均衡器 |
| U28+U35 | `common-control/chip-row` | 2 | 4 | chip 行：首页 .rank-tabs 与<em>一处</em> .cat-row(sticky) |
| U34 | `common-control/page-head` | 9 | 5 | .page-head 公共页头 |
| U24 | `home/banner` | 3 | 13 | .banner-wrap 轮播两条 |
| U25 | `home/quick-row` | 1 | 5 | .quick-row 快捷入口四宫格 |
| U26 | `home/daily-card` | 2 | 9 | .daily-card 今日推荐卡 |
| U27 | `home/pl-card` | 7 | 9 | .pl-grid / .pl-card 推荐歌单区块 |
| U29 | `home/song-list` | 8 | 20 | .song-list 热门单曲区块 |
| U31 | `home/artist-card` | 4 | 4 | .artist-card 热门歌手横滚 |
| U32 | `home/section-note` | 2 | 1 | .section-note 区块说明灰字 |
| U36 | `playlist/my-pl` | 7 | 7 | .my-pl-row 我的歌单一排 |
| U37 | `playlist/pl-count` | 1 | 1 | .pl-count「已列出 N / M 个」计数行 |
| U38 | `playlist/pl-pool` | 4 | 0 | 推荐池区块 |
| U39 | `rank/rank-grid` | 1 | 9 | .rank-grid / .rk-card |
| U40 | `rank/rank-group` | 0 | 4 | .rank-group 平台分段组头 |
| U41 | `rank/chart-art` | 0 | 1 | chartArt 封面体系 |
| U42 | `mine/mine-head` | 8 | 10 | .mine-head 个人头部 |
| U43 | `mine/stat-row` | 1 | 4 | .stat-row / .stat 本地统计三项 |
| U44 | `mine/fav-card` | 2 | 12 | .fav-card 入口卡家族：「我的」页这一处现在只有<em>一张整宽卡</em> |
| U45 | `mine/song-list-compact` | 7 | 3 | .song-list.compact 最近播放区块 |
| U46 | `mine/my-pl-mine` | 7 | 0 | 我的歌单区 |
| U48 | `setting/set-hero` | 2 | 2 | .set-hero / .sh-sub 设定页说明头 |
| U49 | `setting/settings-group` | 1 | 17 | .set-group / .set-list / .set-row / .set-ic / st-l / st-r 设定分组行族 |
| 播放页壳 | `player/_layer` | 1 | 5 | player-layer 壳层 |
| U50 | `player/player-bg` | 1 | 1 | .player-bg 氛围层 |
| U51 | `player/player-top` | 7 | 2 | .player-top + .player-crumb 顶排 |
| U52 | `player/stage` | 3 | 6 | .player-stage / .disc-wrap / .disc 唱片舞台 |
| U53 | `player/lyric` | 2 | 10 | .lyric-wrap/.lyric-scroll/.ln/.ln-note/.ln-empty 歌词层 |
| U54 | `player/stage-dots` | 3 | 0 | .stage-dots 舞台指示点 |
| U55 | `player/player-meta` | 7 | 9 | .player-meta |
| U56 | `player/player-source` | 1 | 2 | .player-source 平台+音质文本行 |
| U57 | `player/seek` | 6 | 6 | .seek 进度条 |
| U58 | `player/seek-time` | 6 | 1 | .seek-time 起止时间行 |
| U59 | `player/player-controls` | 20 | 6 | .player-controls / .pc 主传输行三颗 |
| U60 | `player/player-tools` | 16 | 4 | .player-tools / .pt-btn 次级工具行五颗 |
| U61 | `player/lrc-float` | 6 | 8 | .lrc-float 歌词悬浮窗 |
| 搜索层壳 | `search/_layer` | 1 | 1 | search-layer 壳层 |
| U62 | `search/sc-top` | 18 | 11 | .sc-top / .sc-box / .sc-cancel 搜索头排 |
| U63 | `search/sc-tabs` | 0 | 5 | .sc-tabs 单曲/歌单分段条 |
| U64 | `search/sc-body` | 1 | 6 | #searchBody 滚动体 + .sc-label / .sc-clear |
| U65 | `search/sc-result` | 0 | 3 | .sc-empty / .sc-hint 结果空态与提示族 |
| 详情层壳 | `songlist-detail/_layer` | 1 | 5 | pl-layer 推入壳层 |
| U66 | `songlist-detail/pl-bg` | 1 | 1 | .pl-bg 封面氛围层 |
| U67 | `songlist-detail/pl-top` | 33 | 5 | .pl-top / .pl-crumb / .pl-fav-btn 顶排 |
| U68 | `songlist-detail/pl-hero` | 1 | 7 | .pl-hero 头图区 |
| U69 | `songlist-detail/pl-actions` | 1 | 5 | .pl-actions 播放全部 + 随机钮 |
| U70 | `songlist-detail/pl-tracks` | 1 | 1 | #plTracks 曲目表 |
| U81 | `radio/home` | 9 | 32 | 电台首页 |
| U82 | `radio/detail` | 7 | 14 | 播客详情层 |
| U83 | `radio/search` | 2 | 0 | 搜播客层 |
| U84 | `radio/episode` | 10 | 10 | 单集屏 |
| U85 | `sheets/region-sheet` | 6 | 0 | podRegionSheet 地区抽屉实例件 |
| U86 | `mine/offline` | 6 | 8 | 已缓存 |
| U72 | `sheets/source-sheet` | 29 | 2 | sourceSheet 音源浮层实例 |
| U73 | `sheets/plid-sheet` | 15 | 1 | plIdSheet 打开歌单浮层实例 |
| U74 | `sheets/create-sheet` | 11 | 0 | createSheet 新建歌单浮层实例 |
| U75 | `sheets/tags-sheet` | 7 | 0 | plTagsSheet 全部分类浮层实例 |
| U47 | `sheets/name-sheet` | 25 | 3 | nameSheet 修改浮层实例 |
| U76 | `sheets/more-sheet` | 6 | 6 | moreSheet 单曲操作面板实例 |
| U78+U79 | `sheets/player-sheet` | 8 | 0 | #playerSheet 播放页子面板宿主：定时 / 评论 / 播放列表三种实例共用这一只 DOM |
| U78 | `sheets/timer-sheet` | 0 | 1 | timer 浮层内容件 |
| U79 | `sheets/comment-sheet` | 0 | 15 | comment 浮层内容件 |
| U80 | `sheets/queue-sheet` | 0 | 2 | queue 播放列表面板内容件 |
| U77 | `sheets/confirm-sheet` | 9 | 4 | confirmSheet 二次确认浮层实例 |

## 派单接法建议（RN 侧）

- 一次任务 = 一个小件：读 `parts/…/*.html` + 同名 `.css`，与 RN 对应件逐字对拍。
- 缺件转正优先序（对撞报告第六节 2 条）：U32/U37/U48/U50/U51/U55/U56/U58/U62/U67/U69 十一个内联缺件已在各件头注标「转正候选」；U61 lrc-float 为功能级缺口。
- 共享原子样式只在 `parts/_base.css` 出现一份，别在单元件里找。
