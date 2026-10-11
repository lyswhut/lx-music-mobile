import worker, { MessageEvents, ThreadWorkerGlobalScope } from '@ohos.worker';
import util from '@ohos.util';
import buffer from '@ohos.buffer';
import cryptoFramework from '@ohos.security.cryptoFramework';
import engine from 'liblx_user_api.so';
import { CryptoOperations } from '../nativeModules/CryptoOperations';
import { UserApiCommand, UserApiEvent } from '../nativeModules/UserApiMessages';

const port: ThreadWorkerGlobalScope = worker.workerPort;
const crypto: CryptoOperations = new CryptoOperations();
const base64: util.Base64Helper = new util.Base64Helper();
const timers: Map<number, number> = new Map<number, number>();
let handle: object | undefined;
let key: string = '';
let initialized: boolean = false;
let failed: boolean = false;

function emit(event: UserApiEvent): void {
  port.postMessage(event);
}

function fail(error: Error, requestKey?: string): void {
  failed = true;
  if (requestKey) {
    emit({ action: 'response', data: JSON.stringify({ requestKey, status: false, errorMessage: error.message }) });
  }
  emit({ action: 'init', data: JSON.stringify({ info: null, status: false, errorMessage: error.message }) });
  emit({ action: 'log', type: 'error', log: error.message });
  closeRuntime();
  port.close();
}

function closeRuntime(): void {
  timers.forEach((timer: number) => clearTimeout(timer));
  timers.clear();
  if (handle) engine.destroy(handle);
  handle = undefined;
}

function dispatch(action: string, data: string): void {
  if (!handle || failed) return;
  try {
    engine.call(handle, '__lx_native__', [key, action, data]);
  } catch (error) {
    let requestKey: string | undefined;
    if (action === 'request') requestKey = (JSON.parse(data) as RequestIdentifier).requestKey;
    fail(error as Error, requestKey);
  }
}

interface RequestIdentifier {
  requestKey: string;
}

function nativeCall(name: string, args: string[]): string {
  switch (name) {
    case '__lx_native_call__':
      if (args[0] !== key) return '';
      if (args[1] === 'init') {
        if (initialized) return '';
        initialized = true;
        const timeout = timers.get(-1);
        if (timeout !== undefined) clearTimeout(timeout);
        timers.delete(-1);
      }
      emit({ action: args[1], data: args[2] });
      return '';
    case '__lx_native_call__set_timeout': {
      const id = Number(args[0]);
      if (timers.size >= 1000) throw new Error('Too many script timers');
      timers.set(id, setTimeout(() => {
        timers.delete(id);
        dispatch('__set_timeout__', JSON.stringify(id));
      }, Math.min(2147483647, Math.max(0, Number(args[1])))));
      return '';
    }
    case '__lx_native_call__utils_str2b64':
      return args[0] ? base64.encodeToStringSync(new util.TextEncoder().encodeInto(args[0])) : '';
    case '__lx_native_call__utils_b642buf':
      return JSON.stringify(Array.from(args[0] ? base64.decodeSync(args[0].replace(/\s/g, '')) : new Uint8Array(0)));
    case '__lx_native_call__utils_str2md5': {
      const input = decodeURIComponent(args[0]);
      if (!input) return 'd41d8cd98f00b204e9800998ecf8427e';
      const digest = cryptoFramework.createMd('MD5');
      digest.updateSync({ data: new util.TextEncoder().encodeInto(input) });
      return buffer.from(digest.digestSync().data).toString('hex');
    }
    case '__lx_native_call__utils_aes_encrypt':
      return crypto.aesEncryptSync(args[0], args[1], args[2], args[3]);
    case '__lx_native_call__utils_rsa_encrypt':
      return crypto.rsaEncryptSync(args[0], args[1], args[2]);
    case 'log':
    case 'info':
    case 'warn':
    case 'error':
      emit({ action: 'log', type: name, log: args.join(' ').slice(0, 4096) });
      return '';
    default:
      throw new Error('Unsupported script host operation');
  }
}

port.onmessage = (message: MessageEvents): void => {
  const command = message.data as UserApiCommand;
  if (command.action === 'destroy') {
    closeRuntime();
    port.close();
    return;
  }
  if (command.action === 'load') {
    try {
      closeRuntime();
      failed = false;
      initialized = false;
      const info = command.info;
      if (!info || !command.preload) throw new Error('Missing script or preload');
      key = util.generateRandomUUID();
      handle = engine.create(nativeCall);
      engine.evaluate(handle, command.preload, 'user-api-preload.js');
      engine.call(handle, 'lx_setup', [key, info.id, info.name, info.description, info.version, info.author, info.homepage, info.script]);
      engine.evaluate(handle, info.script, 'user-source.js');
      if (!initialized) {
        timers.set(-1, setTimeout(() => {
          timers.delete(-1);
          fail(new Error('Script initialization timed out'));
        }, 20000));
      }
    } catch (error) {
      fail(error as Error);
    }
    return;
  }
  dispatch(command.action, command.data ?? 'null');
};
