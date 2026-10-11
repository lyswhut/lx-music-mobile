/*
 * 手写的 RNOH 第三方包注册（替代 autolinker 生成的版本）。
 *
 * 原因：RNOH hvigor-plugin 0.2.0 的 autolinker 生成此文件时用 default import
 * （import XxxPackage from '...'），但这批 OH-tpl 库的 Package 类是 named export
 * （export * from './ts'）→ ArkTS 报 "has no default export"。
 * 故在 hvigorfile 里把 autolinker 的 ETS 产物重定向到编译树外，由此文件手动用
 * named import 注册。新增/移除 OH 库时需同步维护这里 + 根 hvigorfile 的 autolinking。
 *
 * 注：fs 为纯 ArkTS（无 C++），只在此 ETS 注册；其余同时有 C++ Package。
 */
import type { RNPackageContext, RNPackage } from '@rnoh/react-native-openharmony';
import { AsyncStoragePackage } from '@react-native-oh-tpl/async-storage';
import { ClipboardPackage } from '@react-native-oh-tpl/clipboard';
import { ExceptionHandlerPackage } from '@react-native-oh-tpl/react-native-exception-handler';
import { RNQuickBase64Package } from '@react-native-oh-tpl/react-native-quick-base64';
import { ViewPagerPackage } from '@react-native-oh-tpl/react-native-pager-view';
import { HarmonyFsPackage } from './nativeModules/HarmonyFsPackage';
import ScreensPackage from '@react-native-oh-tpl/react-native-screens';
import { SafeAreaViewPackage } from '@react-native-oh-tpl/react-native-safe-area-context';
import { HarmonySliderPackage } from './nativeModules/HarmonySliderPackage';

// 返回 RNPackage[](基类,老版本 OH-tpl 包满足之);RNOHPackage 要求更多方法,老包不满足。
export function createRNOHPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new AsyncStoragePackage(ctx),
    new ClipboardPackage(ctx),
    new ExceptionHandlerPackage(ctx),
    new RNQuickBase64Package(ctx),
    new ViewPagerPackage(ctx),
    new HarmonyFsPackage(ctx),
    new ScreensPackage(ctx),
    new SafeAreaViewPackage(ctx),
    new HarmonySliderPackage(ctx),
  ];
}
