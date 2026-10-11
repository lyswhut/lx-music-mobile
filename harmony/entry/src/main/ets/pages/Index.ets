/**
 * RNOH 宿主页面 —— 挂载 RNApp，加载 harmony bundle 并渲染 RN 根组件。
 *
 * appKey / rnInstanceConfig.name = 'lxmusic'，必须与 JS 侧
 * AppRegistry.registerComponent('lxmusic', ...) 完全一致（见 index.harmony.js）。
 *
 * bundle 加载顺序：优先连 Metro 开发服务器；否则回退到 rawfile 里的
 * bundle.harmony.js（由 `npm run bundle-harmony:probe` / `bundle-harmony` 生成）。
 */
import {
  AnyJSBundleProvider,
  MetroJSBundleProvider,
  ResourceJSBundleProvider,
  TraceJSBundleProviderDecorator,
  RNApp,
  RNOHErrorDialog,
  RNOHCoreContext,
} from '@rnoh/react-native-openharmony';
import { getRNOHPackages } from '../PackageProvider';

const APP_KEY = 'lxmusic';

@Entry
@Component
struct Index {
  @StorageLink('RNOHCoreContext') private rnohCoreContext: RNOHCoreContext | undefined = undefined;

  build() {
    Column() {
      if (this.rnohCoreContext) {
        if (this.rnohCoreContext.isDebugModeEnabled) {
          RNOHErrorDialog({ ctx: this.rnohCoreContext });
        }
        RNApp({
          rnInstanceConfig: {
            name: APP_KEY,
            createRNPackages: getRNOHPackages,
            fontResourceByFontFamily: { icomoon: $rawfile('fonts/icomoon.ttf') },
            enableDebugger: this.rnohCoreContext.isDebugModeEnabled,
            // RNOH 0.72.x 必填：ArkTS 实现的 Fabric 组件名列表（无则空数组）
            arkTsComponentNames: [
              'RNCSlider',
              'RNSScreen',
              'RNSFullWindowOverlay',
              'RNSModalScreen',
              'RNSScreenContainer',
              'RNSScreenNavigationContainer',
              'RNSScreenStack',
              'RNSScreenStackHeaderSubview',
              'RNSScreenStackHeaderConfig',
              'RNSSearchBar',
            ],
            // 试：切 C-API 架构（新路径，规避 API26 上 ArkTS 架构的窗口接口不兼容）
            enableCAPIArchitecture: true,
          },
          appKey: APP_KEY,
          jsBundleProvider: new TraceJSBundleProviderDecorator(
            new AnyJSBundleProvider([
              new MetroJSBundleProvider(),
              new ResourceJSBundleProvider(
                this.rnohCoreContext.uiAbilityContext.resourceManager,
                'bundle.harmony.js',
              ),
            ]),
            this.rnohCoreContext.logger,
          ),
        });
      }
    }
    .height('100%')
    .width('100%')
  }
}
