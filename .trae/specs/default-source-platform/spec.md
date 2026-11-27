# 默认音源与默认内容平台

## 1. 目标

应用首次启动（本机无既有选择）时：

1. **默认集成音源**：自动安装脚本 `https://gh-proxy.org/raw.githubusercontent.com/pdone/lx-music-source/main/flower/latest.js`（脚本头 `@name 野花🌷`）。
2. **默认激活音源**：`common.apiSource` 指向该脚本，脚本加载后 `global.lx.qualityList` 生效。
3. **默认选中第一个音乐平台**：内容平台取平台列表首项 `PLATFORM_SOURCE_KEYS[0]`，即 `tx`（QQ音乐）。

## 2. 现状与依据

| 事实 | 位置 |
| --- | --- |
| 启动顺序 `initUserApi` → `setApiSource(setting['common.apiSource'])` | [init/index.ts](file:///mnt/data/owner/lx-music-mobile/src/core/init/index.ts#L39-L52) |
| 启动时只从存储读用户音源列表，不做任何默认导入 | [userApi/index.ts](file:///mnt/data/owner/lx-music-mobile/src/core/init/userApi/index.ts#L230-L231) |
| 导入脚本 = `addUserApi(script)`（解析 `/** */` 头，生成随机 `user_api_*` id），再把列表写回 store | [data.ts](file:///mnt/data/owner/lx-music-mobile/src/utils/data.ts#L554-L572)、[userApi.ts](file:///mnt/data/owner/lx-music-mobile/src/core/userApi.ts#L30-L33) |
| 激活音源 = `setApiSource(id)`，内部写 `common.apiSource` + 加载脚本 | [apiSource.ts](file:///mnt/data/owner/lx-music-mobile/src/core/apiSource.ts#L10-L43) |
| 平台顺序 `tx, wy, kw, kg, mg`，首项为 `tx` | [sources.ts](file:///mnt/data/owner/lx-music-mobile/src/newui/const/sources.ts#L15-L28) |
| 内容平台默认值 `kw`（平台列表第三项） | [constant.ts](file:///mnt/data/owner/lx-music-mobile/src/config/constant.ts#L131-L148) |
| tx 歌单排序表首项 `id: '-1'`（推荐） | [tx/songList.js](file:///mnt/data/owner/lx-music-mobile/src/utils/musicSdk/tx/songList.js#L12-L17) |
| tx 榜单首项 `tx__4`（流行指数榜） | [tx/leaderboard.js](file:///mnt/data/owner/lx-music-mobile/src/utils/musicSdk/tx/leaderboard.js#L5) |

已核实的约束：

- 内置音源表（`api-source-info.ts`）为空，项目里可用音源只能是 `user_api_*`。
- 脚本 URL 返回纯文本 JS，`httpFetch(url).promise` 的 `resp.body` 为字符串。
- `addUserApi` 生成的 id 不可预知，因此以脚本 `@name`（`野花🌷`）作为「是否已集成」的判定键。
- `setApiSource` 会在 id 与当前设置不同时自动 `updateSetting`，无需手动写设置。

## 3. 方案

### 3.1 常量

`src/config/constant.ts` 新增：

```ts
export const DEFAULT_USER_API_URL = 'https://gh-proxy.org/raw.githubusercontent.com/pdone/lx-music-source/main/flower/latest.js'
export const DEFAULT_USER_API_NAME = '野花🌷'
```

### 3.2 启动时确保默认音源（非阻塞）

`src/core/init/userApi/index.ts` 末尾新增 `ensureDefaultUserApi()`，在
`setUserApiList(await getUserApiList())` 之后以 `void ensureDefaultUserApi()` 触发：

1. 读取列表，按 `name === DEFAULT_USER_API_NAME` 查找；找到则直接进入第 3 步。
2. 未找到：`httpFetch(DEFAULT_USER_API_URL)` 取正文 → `addUserApi(script)` →
   `setUserApiList(await getUserApiList())` 刷新 store（音源浮层立即可见）。
3. 读取 `settingState.setting['common.apiSource']`；若为空、或指向的 id 不在列表中，
   调用 `setApiSource(target.id)` 激活默认音源。
4. 任何失败只 `log.warn`，不阻塞启动、不弹窗；`init/index.ts` 原有的
   `setApiSource(setting['common.apiSource'])` 保持不变（已选过音源时立即生效）。

非阻塞的原因：网络请求不应拖慢首屏；首次启动无音源时先短暂空载，导入完成后由
`setApiSource` 触发加载，UI 通过既有 `apiSourceUpdated` 事件自动刷新。

### 3.3 默认平台改为第一项

`src/config/constant.ts` 的 `DEFAULT_SETTING`：

```ts
leaderboard: { source: 'tx', boardId: 'tx__4' },
songList: { source: 'tx', sortId: '-1', tagName: '', tagId: '' },
```

`contentPlatform.ts` 初始快照直接引用 `DEFAULT_SETTING.songList`，因此无需再改。
`search.temp_source` 不属「音乐平台」选择，保持原值。

## 4. 行为边界

- 本机已有有效音源选择时**不覆盖**，只补装默认音源（仍出现在音源列表）。
- 本机已有持久化的平台设置时**不重置**（`DEFAULT_SETTING` 只影响首次启动）。
- 默认音源被用户删除后，下次启动会重新拉取安装（「默认集成」语义）。
- 不新增任何设置项、不改动脚本自更新逻辑。

## 5. 验证

1. `npx tsc --noEmit -p tsconfig.json`：newui / core 无新增错误。
2. `npx eslint src/core/init/userApi/index.ts src/config/constant.ts`：零告警。
3. 手动（清数据/首次安装）：
   - 音源浮层出现「野花🌷」且状态为已就绪；
   - 「音乐平台」组第一行 QQ音乐 为选中态；
   - 首页推荐歌单 / 榜单按 QQ音乐 取数。

## 6. 需确认

- 平台默认值是否只针对首次启动（本机已有 `kw` 等持久化选择时保持不动）？
- 默认音源被删除后是否允许下次启动自动补装？
