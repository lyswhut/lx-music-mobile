/**
 * RNOH Worker 线程入口（RN 实例跑在 worker 上）。
 *
 * 注意：此处必须用直接路径 import setupRNOHWorker，不能用
 * `import { setupRNOHWorker } from '@rnoh/react-native-openharmony'`，
 * 否则 ArkTS 运行期报错（RNOH 官方模板注释说明）。
 */
import { setupRNOHWorker } from '@rnoh/react-native-openharmony/src/main/ets/setupRNOHWorker';
import { getRNOHPackages } from '../PackageProvider';

setupRNOHWorker({
  createWorkerRNInstanceConfig: (_rnInstanceName) => {
    return { thirdPartyPackagesFactory: getRNOHPackages };
  },
});
