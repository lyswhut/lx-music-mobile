import { NativeStackNavigatorProps } from '../native-stack/types';

interface HostInstance {
  _internalInstanceHandle: {
    stateNode: {
      node: Record<string, unknown>;
    };
  };
  _nativeTag: number;
}

type LocalGlobal = typeof global & Record<string, unknown>;

export function isFabric() {
  return !!(global as LocalGlobal)._IS_FABRIC;
}

let findHostInstance: (ref: React.Component) => HostInstance | null = () => {
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

export function getShadowNodeWrapperAndTagFromRef(
  ref: React.Ref<NativeStackNavigatorProps> | React.Component,
) {
  const hostInstance = findHostInstance(ref as React.Component);
  return {
    shadowNodeWrapper: hostInstance?._internalInstanceHandle.stateNode.node,
    tag: hostInstance?._nativeTag,
  };
}
