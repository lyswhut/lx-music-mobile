"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getShadowNodeWrapperAndTagFromRef = getShadowNodeWrapperAndTagFromRef;
exports.isFabric = isFabric;
function isFabric() {
  return !!global._IS_FABRIC;
}
let findHostInstance = () => {
  return null;
};
if (isFabric()) {
  try {
    findHostInstance =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('react-native/Libraries/Renderer/shims/ReactFabric').findHostInstance_DEPRECATED;
  } catch (e) {
    throw new Error('[RNScreens] Cannot import `findHostInstance_DEPRECATED`.');
  }
}
function getShadowNodeWrapperAndTagFromRef(ref) {
  const hostInstance = findHostInstance(ref);
  return {
    shadowNodeWrapper: hostInstance?._internalInstanceHandle.stateNode.node,
    tag: hostInstance?._nativeTag
  };
}
//# sourceMappingURL=fabricUtils.js.map