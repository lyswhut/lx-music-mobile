import { UITurboModule } from '@rnoh/react-native-openharmony';
import window from '@ohos.window';
import deviceInfo from '@ohos.deviceInfo';
import i18n from '@ohos.i18n';
import wifiManager from '@ohos.wifiManager';
import notificationManager from '@ohos.notificationManager';
import commonEventManager from '@ohos.commonEventManager';
import { systemShare } from '@kit.ShareKit';
import { uniformTypeDescriptor } from '@kit.ArkData';
import picker from '@ohos.file.picker';
import fs from '@ohos.file.fs';
import fileUri from '@ohos.file.fileuri';
import util from '@ohos.util';

export class UtilsModule extends UITurboModule {
  static readonly NAME: string = 'UtilsModule';
  private screenSubscriber?: commonEventManager.CommonEventSubscriber;
  private listeningWindow?: window.Window;
  private windowListenerPending: boolean = false;
  private destroyed: boolean = false;
  private screenListenerCount: number = 0;
  private sizeListenerCount: number = 0;
  private readonly sizeChanged = (size: window.Size): void => {
    this.ctx.rnInstance.emitDeviceEvent('screen-size-changed', {
      width: size.width,
      height: size.height,
    });
  };

  exitApp(): void {
    this.ctx.uiAbilityContext.terminateSelf().catch((error: Error) => {
      this.ctx.logger.error(error.message);
    });
  }

  async getSupportedAbis(): Promise<string[]> {
    return deviceInfo.abiList.split(',');
  }

  async installApk(_filePath: string, _fileProviderAuthority: string): Promise<void> {
    throw new Error('HarmonyOS does not support installing Android APKs');
  }

  screenkeepAwake(): void {
    this.setKeepScreenOn(true).catch((error: Error) => this.ctx.logger.error(error.message));
  }

  screenUnkeepAwake(): void {
    this.setKeepScreenOn(false).catch((error: Error) => this.ctx.logger.error(error.message));
  }

  private async setKeepScreenOn(enabled: boolean): Promise<void> {
    const appWindow = await this.ctx.rnInstance.getRNWindow();
    await appWindow.setWindowKeepScreenOn(enabled);
  }

  async getWIFIIPV4Address(): Promise<string> {
    const address = wifiManager.getIpInfo().ipAddress;
    return [address & 255, (address >>> 8) & 255, (address >>> 16) & 255, (address >>> 24) & 255].join('.');
  }

  async getDeviceName(): Promise<string> {
    return deviceInfo.marketName || deviceInfo.productModel || 'Unknown';
  }

  async openDocument(extTypes: string[], toPath: string): Promise<string> {
    const options: picker.DocumentSelectOptions = { maxSelectNumber: 1 };
    if (extTypes.length) options.fileSuffixFilters = [extTypes.map((extension: string) => `.${extension}`).join(',')];
    const uris = await new picker.DocumentViewPicker(this.ctx.uiAbilityContext).select(options);
    if (!uris.length) return '';
    const directory = toPath || `${this.ctx.uiAbilityContext.cacheDir}/tempFile`;
    if (!await fs.access(directory)) await fs.mkdir(directory, true);
    const name = new fileUri.FileUri(uris[0]).name;
    const path = `${directory}/${util.generateRandomUUID()}-${name}`;
    const source = await fs.open(uris[0], fs.OpenMode.READ_ONLY);
    try {
      await fs.copyFile(source.fd, path);
    } catch (error) {
      if (await fs.access(path)) await fs.unlink(path);
      throw new Error((error as Error).message);
    } finally {
      await fs.close(source);
    }
    return path;
  }

  async isNotificationsEnabled(): Promise<boolean> {
    return notificationManager.isNotificationEnabled();
  }

  async openNotificationPermissionActivity(): Promise<boolean> {
    try {
      await notificationManager.requestEnableNotification(this.ctx.uiAbilityContext);
      return notificationManager.isNotificationEnabled();
    } catch (error) {
      this.ctx.logger.warn('Notification permission request failed');
      return false;
    }
  }

  async shareText(_shareTitle: string, title: string, text: string): Promise<void> {
    const sharedData = new systemShare.SharedData({
      utd: uniformTypeDescriptor.UniformDataType.PLAIN_TEXT,
      content: text,
      title,
    });
    const controller = new systemShare.ShareController(sharedData);
    await controller.show(this.ctx.uiAbilityContext, {
      previewMode: systemShare.SharePreviewMode.DETAIL,
      selectionMode: systemShare.SelectionMode.SINGLE,
    });
  }

  async getSystemLocales(): Promise<string> {
    const locale = new Intl.Locale(i18n.System.getSystemLocale());
    return (locale.region ? `${locale.language}_${locale.region}` : locale.language).toLowerCase();
  }

  async getWindowSize(): Promise<window.Size> {
    const appWindow = await this.ctx.rnInstance.getRNWindow();
    const rect = appWindow.getWindowProperties().windowRect;
    return { width: rect.width, height: rect.height };
  }

  listenWindowSizeChanged(): void {
    this.startWindowListener().catch((error: Error) => this.ctx.logger.error(error.message));
  }

  private async startWindowListener(): Promise<void> {
    if (this.listeningWindow || this.windowListenerPending || this.destroyed) return;
    this.windowListenerPending = true;
    try {
      const appWindow = await this.ctx.rnInstance.getRNWindow();
      if (this.destroyed || this.sizeListenerCount === 0) return;
      appWindow.on('windowSizeChange', this.sizeChanged);
      this.listeningWindow = appWindow;
    } finally {
      this.windowListenerPending = false;
    }
  }

  async isIgnoringBatteryOptimization(): Promise<boolean> {
    return false;
  }

  async requestIgnoreBatteryOptimization(): Promise<boolean> {
    return false;
  }

  addListener(eventName: string): void {
    if (eventName === 'screen-size-changed') {
      this.sizeListenerCount++;
      this.listenWindowSizeChanged();
    } else if (eventName === 'screen-state') {
      this.screenListenerCount++;
      this.startScreenListener().catch((error: Error) => this.ctx.logger.error(error.message));
    }
  }

  removeListeners(_count: number): void {}

  removeListener(eventName: string): void {
    if (eventName === 'screen-size-changed') {
      this.sizeListenerCount = Math.max(0, this.sizeListenerCount - 1);
      if (this.sizeListenerCount === 0) {
        this.listeningWindow?.off('windowSizeChange', this.sizeChanged);
        this.listeningWindow = undefined;
      }
    } else if (eventName === 'screen-state') {
      this.screenListenerCount = Math.max(0, this.screenListenerCount - 1);
      if (this.screenListenerCount === 0) this.stopScreenListener();
    }
  }

  private async startScreenListener(): Promise<void> {
    if (this.screenSubscriber || this.destroyed) return;
    const subscriber = await commonEventManager.createSubscriber({
      events: ['usual.event.SCREEN_ON', 'usual.event.SCREEN_OFF'],
    });
    if (this.destroyed || this.screenListenerCount === 0 || this.screenSubscriber) return;
    this.screenSubscriber = subscriber;
    commonEventManager.subscribe(subscriber, (error, data) => {
      if (error || this.destroyed) return;
      this.ctx.rnInstance.emitDeviceEvent('screen-state', {
        state: data.event === 'usual.event.SCREEN_ON' ? 'ON' : 'OFF',
      });
    });
  }

  private stopScreenListener(): void {
    if (this.screenSubscriber) commonEventManager.unsubscribe(this.screenSubscriber);
    this.screenSubscriber = undefined;
  }

  __onDestroy__(): void {
    this.destroyed = true;
    this.stopScreenListener();
    this.listeningWindow?.off('windowSizeChange', this.sizeChanged);
    this.listeningWindow = undefined;
    super.__onDestroy__();
  }
}
