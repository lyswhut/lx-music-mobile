/**
 * RNOH 工程级 hvigor 配置：挂载 RNOH 工程插件（负责 autolinking 等）。
 */
import { appTasks } from '@ohos/hvigor-ohos-plugin';
import { createRNOHProjectPlugin } from '@rnoh/hvigor-plugin';

export default {
  system: appTasks,
  plugins: [createRNOHProjectPlugin()],
};
