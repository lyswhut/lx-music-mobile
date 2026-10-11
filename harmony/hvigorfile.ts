/**
 * RNOH 工程级 hvigor 配置（插件 0.2.0：单一工厂，项目级应用，一次完成
 * autolinking + codegen，生成物写入 entry 模块）。
 */
import { appTasks } from '@ohos/hvigor-ohos-plugin';
import { createRNOHHvigorPlugin } from '@rnoh/hvigor-plugin';

export default {
  system: appTasks,
  plugins: [
    createRNOHHvigorPlugin({
      // rnohModulePath 相对 harmony/ 根；.har 已装于 oh_modules
      codegen: { rnohModulePath: './oh_modules/@rnoh/react-native-openharmony' },
      // 默认路径(./entry/src/main/...、./oh-package.json5、../node_modules)均正确
      autolinking: {},
    }),
  ],
};
