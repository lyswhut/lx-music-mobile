/*
 * 手写的 RNOH C++ 第三方包注册（替代 autolinker 生成的版本）。
 *
 * 原因：0.2.0 autolinker 生成的 RNOHPackagesFactory.h 引用了它并不生成的别名头
 *（ReactNativeOhTplXxxPackage.h）→ C++ 编译 "file not found"。故在 hvigorfile 把
 * autolinker 的 C++ 产物也重定向到编译树外,此处用各包真实头手动注册。
 *
 * 注：fs 纯 ArkTS(无 C++),只在 ETS 注册。
 * 新增/移除含 C++ 的 OH 库时,需同步这里 + autolinking.cmake(由 autolinker 按
 * 各包 harmony.autolinking 元数据生成)。
 */
#pragma once
#include "RNOH/Package.h"
#include "AsyncStoragePackage.h"
#include "ClipboardPackage.h"
#include "ExceptionHandlerPackage.h"
#include "RNQuickBase64Package.h"
#include "HarmonyViewPagerPackage.h"
#include "ScreensPackage.h"
#include "SafeAreaViewPackage.h"
#include "SliderPackage.h"

using namespace rnoh;

std::vector<Package::Shared> createRNOHPackages(const Package::Context &ctx) {
  return {
    std::make_shared<AsyncStoragePackage>(ctx),
    std::make_shared<ClipboardPackage>(ctx),
    std::make_shared<ExceptionHandlerPackage>(ctx),
    std::make_shared<RNQuickBase64Package>(ctx),
    std::make_shared<HarmonyViewPagerPackage>(ctx),
    std::make_shared<ScreensPackage>(ctx),
    std::make_shared<SafeAreaViewPackage>(ctx),
    std::make_shared<SliderPackage>(ctx),
  };
}
