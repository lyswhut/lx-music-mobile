let supportsCodegenConfig = false;
try {
  const rnCliAndroidVersion =
    require('@react-native-community/cli-platform-android/package.json').version;
  const [major] = rnCliAndroidVersion.split('.');
  supportsCodegenConfig = major >= 9;
} catch (e) {
  // ignore
}

module.exports = {
  dependency: {
    platforms: {
      android: supportsCodegenConfig
        ? {
            componentDescriptors: [
              'RNSFullWindowOverlayComponentDescriptor',
              'RNSScreenContainerComponentDescriptor',
              'RNSScreenNavigationContainerComponentDescriptor',
              'RNSScreenStackHeaderConfigComponentDescriptor',
              'RNSScreenStackHeaderSubviewComponentDescriptor',
              'RNSScreenStackComponentDescriptor',
              'RNSSearchBarComponentDescriptor',
              'RNSScreenComponentDescriptor',
              'RNSModalScreenComponentDescriptor',
            ],
            cmakeListsPath: '../android/src/main/jni/CMakeLists.txt',
          }
        : {},
    },
  },
};
