import { UITurboModule } from '@rnoh/react-native-openharmony';

export class BackgroundTimerModule extends UITurboModule {
  static readonly NAME: string = 'RNBackgroundTimer';
  private timers: Map<number, number> = new Map<number, number>();
  private startTimer?: number;

  setTimeout(id: number, delay: number): void {
    this.clearTimeout(id);
    this.timers.set(id, setTimeout(() => {
      this.timers.delete(id);
      this.ctx.rnInstance.emitDeviceEvent('backgroundTimer.timeout', id);
    }, Math.max(0, delay)));
  }

  clearTimeout(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(id);
  }

  start(delay: number): void {
    this.stop();
    this.startTimer = setTimeout(() => {
      this.startTimer = undefined;
      this.ctx.rnInstance.emitDeviceEvent('backgroundTimer', {});
    }, Math.max(0, delay));
  }

  stop(): void {
    if (this.startTimer !== undefined) clearTimeout(this.startTimer);
    this.startTimer = undefined;
  }

  __onDestroy__(): void {
    this.stop();
    this.timers.forEach((timer: number) => clearTimeout(timer));
    this.timers.clear();
    super.__onDestroy__();
  }
}
