/**
 * RNOH 第三方包提供者。
 *
 * createRNOHPackages 来自 ./RNOHPackagesFactory —— 该文件由 RNOH hvigor 插件
 * 在构建时根据 autolinking 自动生成（本仓不手写、不入库）。首次构建前它不存在，
 * 构建时生成。
 */
import type { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony';
import { createRNOHPackages as createRNOHPackagesAutolinking } from './RNOHPackagesFactory';

export function getRNOHPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    ...createRNOHPackagesAutolinking(ctx),
  ];
}
