/**
 * RNOH C++ 包提供者。
 * createRNOHPackages / RNOHGeneratedPackage 由 RNOH codegen 构建时生成
 * （RNOHPackagesFactory.h、generated/ 目录，不手写、不入库）。
 */
#include "RNOH/PackageProvider.h"
#include "RNOHPackagesFactory.h"
#include "generated/RNOHGeneratedPackage.h"

using namespace rnoh;

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(
    Package::Context ctx) {
  auto packages = createRNOHPackages(ctx); // autolinking
  packages.push_back(std::make_shared<RNOHGeneratedPackage>(ctx)); // codegen
  return packages;
}
