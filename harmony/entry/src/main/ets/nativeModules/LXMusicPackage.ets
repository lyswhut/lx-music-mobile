import { RNPackage, UITurboModule, UITurboModuleContext } from '@rnoh/react-native-openharmony';
import { UtilsModule } from './UtilsModule';
import { TrackPlayerModule } from './TrackPlayerModule';
import { BackgroundTimerModule } from './BackgroundTimerModule';
import { CryptoModule } from './CryptoModule';
import { UserApiModule } from './UserApiModule';

export class LXMusicPackage extends RNPackage {
  getUITurboModuleFactoryByNameMap(): Map<string, (ctx: UITurboModuleContext) => UITurboModule> {
    return new Map<string, (ctx: UITurboModuleContext) => UITurboModule>([
      [UtilsModule.NAME, (ctx: UITurboModuleContext): UITurboModule => new UtilsModule(ctx)],
      [TrackPlayerModule.NAME, (ctx: UITurboModuleContext): UITurboModule => new TrackPlayerModule(ctx)],
      [BackgroundTimerModule.NAME, (ctx: UITurboModuleContext): UITurboModule => new BackgroundTimerModule(ctx)],
      [CryptoModule.NAME, (ctx: UITurboModuleContext): UITurboModule => new CryptoModule(ctx)],
      [UserApiModule.NAME, (ctx: UITurboModuleContext): UITurboModule => new UserApiModule(ctx)],
    ]);
  }
}
