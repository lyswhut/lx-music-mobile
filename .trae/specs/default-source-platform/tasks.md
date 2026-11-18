# Tasks

- [x] 1. `src/config/constant.ts`
  - 新增 `DEFAULT_USER_API_URL`、`DEFAULT_USER_API_NAME`。
  - `DEFAULT_SETTING.leaderboard` 改为 `{ source: 'tx', boardId: 'tx__4' }`。
  - `DEFAULT_SETTING.songList` 改为 `{ source: 'tx', sortId: '-1', tagName: '', tagId: '' }`。
- [x] 2. `src/core/init/userApi/index.ts`
  - 引入 `setApiSource`、`httpFetch`、`addUserApi`、`DEFAULT_USER_API_*`。
  - 新增 `ensureDefaultUserApi()`：按名称查 → 缺失则拉取并导入 → 刷新列表 →
    当前 `common.apiSource` 为空/失效时 `setApiSource(target.id)`；失败仅 `log.warn`。
  - 函数末尾 `setUserApiList(...)` 之后 `void ensureDefaultUserApi()`。
- [x] 3. 校验
  - `npx tsc --noEmit -p tsconfig.json`（仅原有 5 个无关错误，无新增）
  - `npx eslint src/core/init/userApi/index.ts src/config/constant.ts`（零告警）
