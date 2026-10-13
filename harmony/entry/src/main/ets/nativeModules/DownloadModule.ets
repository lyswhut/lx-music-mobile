import { UITurboModule } from '@rnoh/react-native-openharmony';
import picker from '@ohos.file.picker';
import fs from '@ohos.file.fs';
import fileUri from '@ohos.file.fileuri';
import fileShare from '@ohos.fileshare';
import preferences from '@ohos.data.preferences';
import http from '@ohos.net.http';
import deviceInfo from '@ohos.deviceInfo';

class DownloadJob {
  id: string;
  request: http.HttpRequest = http.createHttp();
  cancelled: boolean = false;
  abort?: () => void;

  constructor(id: string) {
    this.id = id;
  }

  cancel(): void {
    this.cancelled = true;
    this.abort?.();
    this.request.destroy();
  }
}

export class DownloadModule extends UITurboModule {
  static readonly NAME: string = 'LXDownload';
  private job?: DownloadJob;
  private directory: string = '';
  private destroyed: boolean = false;
  private preparing: boolean = false;

  private policy(uri: string): fileShare.PolicyInfo[] {
    return [{
      uri,
      operationMode: fileShare.OperationMode.READ_MODE |
        fileShare.OperationMode.WRITE_MODE |
        fileShare.OperationMode.CREATE_MODE,
    }];
  }

  private getDirectoryPath(uri: string): string {
    const path = new fileUri.FileUri(uri).path.replace(/\/+$/, '');
    if (path.endsWith('/Download')) return `${path}/LX Music`;
    if (path.endsWith('/Download/LX Music')) return path;
    throw new Error('请选择 Download（下载）目录，或其中的 LX Music 文件夹');
  }

  async prepareDirectory(): Promise<string> {
    if (this.destroyed) throw new Error('下载模块已关闭');
    if (this.directory) return this.directory;
    if (this.preparing) throw new Error('下载目录授权正在进行');
    this.preparing = true;
    try {
      return await this.authorizeDirectory();
    } finally {
      this.preparing = false;
    }
  }

  private async authorizeDirectory(): Promise<string> {
    const store = await preferences.getPreferences(this.ctx.uiAbilityContext, { name: 'lx-download' });
    const saved = await store.get('directoryUri', '');
    if (typeof saved === 'string' && saved) {
      try {
        await fileShare.activatePermission(this.policy(saved));
        const path = this.getDirectoryPath(saved);
        if (!await fs.access(path)) await fs.mkdir(path, true);
        if (this.destroyed) throw new Error('下载模块已关闭');
        this.directory = path;
        return path;
      } catch (_error) {
        await store.delete('directoryUri');
        await store.flush();
      }
    }
    if (this.destroyed) throw new Error('下载模块已关闭');
    if (deviceInfo.sdkApiVersion < 26) throw new Error('当前系统不支持手机目录授权，请升级到 API 26 或更新的 HarmonyOS');
    const documentPicker = new picker.DocumentViewPicker(this.ctx.uiAbilityContext);
    const downloadUris = await documentPicker.save({ pickerMode: picker.DocumentPickerMode.DOWNLOAD });
    if (!downloadUris.length) return '';
    const defaultUri = downloadUris[0].replace(/\/+$/, '').replace(/\/[^/]+$/, '');
    const uris = await documentPicker.select({
      selectMode: picker.DocumentSelectMode.FOLDER,
      maxSelectNumber: 1,
      defaultFilePathUri: defaultUri,
    });
    if (!uris.length) return '';
    if (this.destroyed) throw new Error('下载模块已关闭');
    const path = this.getDirectoryPath(uris[0]);
    await fileShare.persistPermission(this.policy(uris[0]));
    await fileShare.activatePermission(this.policy(uris[0]));
    if (!await fs.access(path)) await fs.mkdir(path, true);
    await store.put('directoryUri', uris[0]);
    await store.flush();
    if (this.destroyed) throw new Error('下载模块已关闭');
    this.directory = path;
    return path;
  }

  private detectExtension(path: string): string {
    const file = fs.openSync(path, fs.OpenMode.READ_ONLY);
    const buffer = new ArrayBuffer(64);
    let length = 0;
    try {
      length = fs.readSync(file.fd, buffer);
    } finally {
      fs.closeSync(file);
    }
    const bytes = new Uint8Array(buffer);
    const prefix = (text: string, offset: number = 0): boolean => {
      if (length < offset + text.length) return false;
      for (let index = 0; index < text.length; index++) {
        if (bytes[offset + index] !== text.charCodeAt(index)) return false;
      }
      return true;
    };
    if (prefix('fLaC')) return 'flac';
    if (prefix('ID3')) return 'mp3';
    if (prefix('RIFF') && prefix('WAVE', 8)) return 'wav';
    if (prefix('OggS')) return 'ogg';
    if (prefix('ftyp', 4)) return 'm4a';
    if (prefix('MAC ')) return 'ape';
    if (length >= 2 && bytes[0] === 255 && (bytes[1] & 246) === 240) return 'aac';
    if (length >= 2 && bytes[0] === 255 && (bytes[1] & 224) === 224) return 'mp3';
    throw new Error('音源未返回可保存的音频文件（暂不支持 HLS 分段下载）');
  }

  async downloadMusic(id: string, url: string, name: string): Promise<string> {
    if (this.destroyed) throw new Error('下载模块已关闭');
    if (this.job) throw new Error('已有歌曲正在下载');
    if (!this.directory) throw new Error('请先授权下载目录');
    if (!/^https?:\/\//i.test(url)) throw new Error('音源返回的下载地址无效');
    const job = new DownloadJob(id);
    this.job = job;
    const temporaryPath = `${this.ctx.uiAbilityContext.cacheDir}/lx-download-${Date.now()}.part`;
    let output: fs.File | undefined;
    let destination = '';
    let completed = false;
    let received = 0;
    let total = 0;
    let streamError: Error | undefined;
    let lastProgress = 0;
    try {
      output = await fs.open(temporaryPath, fs.OpenMode.CREATE | fs.OpenMode.READ_WRITE | fs.OpenMode.TRUNC);
      if (job.cancelled) throw new Error('下载已取消');
      const fileDescriptor = output.fd;
      const ended = new Promise<void>((resolve, reject) => {
        job.abort = (): void => reject(new Error('下载已取消'));
        job.request.on('dataEnd', (): void => resolve());
        job.request.on('dataReceive', (buffer: ArrayBuffer): void => {
          if (job.cancelled || streamError) return;
          try {
            let offset = 0;
            while (offset < buffer.byteLength) {
              const written = fs.writeSync(fileDescriptor, buffer.slice(offset));
              if (written <= 0) throw new Error('音频文件写入失败');
              offset += written;
            }
            received += buffer.byteLength;
            if (Date.now() - lastProgress >= 250) {
              lastProgress = Date.now();
              this.ctx.rnInstance.emitDeviceEvent('lx-download-progress', { id, received, total });
            }
          } catch (error) {
            streamError = new Error((error as Error).message);
            reject(streamError);
            job.request.destroy();
          }
        });
      });
      job.request.on('dataReceiveProgress', (progress: http.DataReceiveProgressInfo): void => {
        total = progress.totalSize;
      });
      const response = job.request.requestInStream(url, {
        method: http.RequestMethod.GET,
        header: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Mobile Safari/537.36' },
        connectTimeout: 15000,
        readTimeout: 120000,
      });
      const results = await Promise.all([response, ended]);
      if (job.cancelled) throw new Error('下载已取消');
      if (streamError) throw streamError;
      if (results[0] < 200 || results[0] >= 300) throw new Error(`下载失败：HTTP ${results[0]}（未请求分段内容）`);
      if (!received || (total > 0 && received !== total)) throw new Error('下载内容不完整，请重试');
      await fs.close(output);
      output = undefined;
      const extension = this.detectExtension(temporaryPath);
      const safeName = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/[. ]+$/, '').slice(0, 100) || '歌曲';
      destination = `${this.directory}/${safeName}.${extension}`;
      let suffix = 1;
      while (await fs.access(destination)) destination = `${this.directory}/${safeName} (${suffix++}).${extension}`;
      if (job.cancelled) throw new Error('下载已取消');
      await fs.copyFile(temporaryPath, destination);
      if (job.cancelled) throw new Error('下载已取消');
      completed = true;
      this.ctx.rnInstance.emitDeviceEvent('lx-download-progress', { id, received, total: received });
      return destination;
    } finally {
      try {
        job.request.destroy();
        if (output) await fs.close(output);
      } finally {
        try {
          if (await fs.access(temporaryPath)) await fs.unlink(temporaryPath);
        } finally {
          try {
            if (!completed && destination && await fs.access(destination)) await fs.unlink(destination);
          } finally {
            if (this.job === job) this.job = undefined;
          }
        }
      }
    }
  }

  cancelDownload(id: string): void {
    if (this.job?.id === id) this.job.cancel();
  }

  __onDestroy__(): void {
    this.destroyed = true;
    this.job?.cancel();
    super.__onDestroy__();
  }
}
