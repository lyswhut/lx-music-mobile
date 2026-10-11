/**
 * entry 模块 hvigor 配置。
 * RNOH 插件 0.2.0 是单一项目级插件（见根 hvigorfile.ts），模块级无需再挂，
 * 故此处仅保留内置 hapTasks。
 */
import { hapTasks } from '@ohos/hvigor-ohos-plugin';

export default {
  system: hapTasks,
  plugins: [],
};
