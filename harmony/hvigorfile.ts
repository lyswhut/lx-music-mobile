/**
 * RNOH 工程级 hvigor 配置（插件 0.2.0：单一工厂，项目级应用，一次完成
 * autolinking + codegen，生成物写入 entry 模块）。
 */
import { appTasks } from '@ohos/hvigor-ohos-plugin';
import { createRNOHHvigorPlugin } from '@rnoh/hvigor-plugin';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

mkdirSync(resolve(__dirname, 'entry/.rnoh-autolink'), { recursive: true });

export default {
  system: appTasks,
  plugins: [
    createRNOHHvigorPlugin({
      // rnohModulePath 相对 harmony/ 根；.har 已装于 oh_modules
      codegen: { rnohModulePath: './oh_modules/@rnoh/react-native-openharmony' },
      // autolinking 生成的 ETS 注册文件对 OH-tpl 库用 default import，而这些库是
      // named export → ArkTS 报错。故把 autolinker 的 ETS 产物重定向到编译树外，
      // 改由我们手写 entry/src/main/ets/RNOHPackagesFactory.ets（named import）。
      // C++(RNOHPackagesFactory.h)与 cmake(autolinking.cmake)仍用 autolinker 生成的。
      autolinking: {
        etsRNOHPackagesFactoryPath: './entry/.rnoh-autolink/RNOHPackagesFactory.ets',
        cppRNOHPackagesFactoryPath: './entry/.rnoh-autolink/RNOHPackagesFactory.h',
      },
    }),
  ],
};
