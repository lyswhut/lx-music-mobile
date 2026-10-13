import { UITurboModule } from '@rnoh/react-native-openharmony';
import worker, { MessageEvents, ErrorEvent } from '@ohos.worker';
import buffer from '@ohos.buffer';
import { UserApiCommand, UserApiEvent, UserScriptInfo } from './UserApiMessages';

export class UserApiModule extends UITurboModule {
  static readonly NAME: string = 'UserApiModule';
  private scriptWorker?: worker.ThreadWorker;
  private generation: number = 0;
  private disposed: boolean = false;

  loadScript(info: UserScriptInfo): void {
    this.destroy();
    if (this.disposed) return;
    const generation = this.generation;
    try {
      const scriptWorker = new worker.ThreadWorker('entry/ets/workers/UserApiWorker.ets');
      this.scriptWorker = scriptWorker;
      scriptWorker.onmessage = (message: MessageEvents): void => {
        if (this.scriptWorker !== scriptWorker || generation !== this.generation) return;
        this.ctx.rnInstance.emitDeviceEvent('api-action', message.data as UserApiEvent);
      };
      scriptWorker.onerror = (event: ErrorEvent): void => {
        if (this.scriptWorker !== scriptWorker) return;
        this.emitFailure(event.message);
        this.destroy();
      };
      scriptWorker.onmessageerror = (): void => {
        if (this.scriptWorker !== scriptWorker) return;
        this.emitFailure('Unable to transfer script message');
        this.destroy();
      };
      scriptWorker.onexit = (): void => {
        if (this.scriptWorker === scriptWorker) this.scriptWorker = undefined;
      };
      this.ctx.uiAbilityContext.resourceManager.getRawFileContent('user-api-preload.js').then((bytes: Uint8Array) => {
        if (this.scriptWorker !== scriptWorker || generation !== this.generation) return;
        const command: UserApiCommand = { action: 'load', info, preload: buffer.from(bytes).toString('utf8') };
        scriptWorker.postMessage(command);
      }).catch((error: Error) => {
        if (this.scriptWorker !== scriptWorker) return;
        this.emitFailure(error.message);
        this.destroy();
      });
    } catch (error) {
      this.emitFailure((error as Error).message);
      this.destroy();
    }
  }

  sendAction(action: string, data: string): void {
    if (!this.scriptWorker) throw new Error('Custom source script is not loaded');
    const command: UserApiCommand = { action, data };
    this.scriptWorker.postMessage(command);
  }

  private emitFailure(message: string): void {
    this.ctx.rnInstance.emitDeviceEvent('api-action', {
      action: 'init', data: JSON.stringify({ info: null, status: false, errorMessage: message }),
    });
    this.ctx.rnInstance.emitDeviceEvent('api-action', { action: 'log', type: 'error', log: message });
  }

  destroy(): void {
    this.generation++;
    const scriptWorker = this.scriptWorker;
    this.scriptWorker = undefined;
    if (!scriptWorker) return;
    const command: UserApiCommand = { action: 'destroy' };
    try {
      scriptWorker.postMessage(command);
    } catch (error) {
      this.ctx.logger.warn((error as Error).message);
    }
  }

  __onDestroy__(): void {
    this.disposed = true;
    this.destroy();
    super.__onDestroy__();
  }
}
