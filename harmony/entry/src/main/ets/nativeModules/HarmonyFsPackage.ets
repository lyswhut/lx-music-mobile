import { RNPackage, TurboModule, TurboModuleContext, TurboModulesFactory } from '@rnoh/react-native-openharmony';
import { FsTurboModule } from '@react-native-oh-tpl/react-native-fs/src/main/ets/FsTurboModule';
import fs from '@ohos.file.fs';

class HarmonyFsTurboModule extends FsTurboModule {
  addListener(_eventName: string): void {}

  removeListeners(_count: number): void {}

  override async unlink(path: string): Promise<void> {
    const info = await fs.stat(path);
    if (info.isDirectory()) await fs.rmdir(path);
    else await fs.unlink(path);
  }
}

class HarmonyFsFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name !== 'ReactNativeFs') return null;
    globalThis.uiAbilityContext = this.ctx.uiAbilityContext;
    return new HarmonyFsTurboModule(this.ctx);
  }

  hasTurboModule(name: string): boolean {
    return name === 'ReactNativeFs';
  }
}

export class HarmonyFsPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new HarmonyFsFactory(ctx);
  }
}
