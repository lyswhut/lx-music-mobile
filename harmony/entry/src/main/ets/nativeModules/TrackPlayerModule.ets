import { UITurboModule } from '@rnoh/react-native-openharmony';
import media from '@ohos.multimedia.media';
import audio from '@ohos.multimedia.audio';
import avSession from '@ohos.multimedia.avsession';
import fileIo from '@ohos.file.fs';
import wantAgent from '@ohos.app.ability.wantAgent';
import backgroundTaskManager from '@ohos.resourceschedule.backgroundTaskManager';
import { BusinessError } from '@kit.BasicServicesKit';

interface TrackMetadata {
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  duration?: number;
  lyric?: string;
}

interface Track extends TrackMetadata {
  url: string;
  userAgent?: string;
  headers?: Record<string, string>;
}

interface PlayerOptions {
  autoUpdateMetadata?: boolean;
  handleAudioFocus?: boolean;
}

interface ControlOptions {
  capabilities?: number[];
}

enum PlayerState {
  None = 0,
  Ready = 1,
  Playing = 2,
  Paused = 3,
  Stopped = 4,
  Buffering = 5,
  Connecting = 6,
}

export class TrackPlayerModule extends UITurboModule {
  static readonly NAME: string = 'LXTrackPlayer';
  private player?: media.AVPlayer;
  private session?: avSession.AVSession;
  private queue: Track[] = [];
  private currentIndex: number = -1;
  private state: PlayerState = PlayerState.None;
  private volume: number = 1;
  private rate: number = 1;
  private repeatMode: number = 0;
  private bufferedSeconds: number = 0;
  private autoUpdateMetadata: boolean = true;
  private metadata: TrackMetadata = {};
  private capabilities: number[] = [0, 3, 4, 5, 7, 8];
  private actions: Promise<void> = Promise.resolve();
  private sessionUpdates: Promise<void> = Promise.resolve();
  private backgroundRunning: boolean = false;
  private localFile?: fileIo.File;
  private rawFilePath?: string;
  private prepareResolve?: () => void;
  private prepareReject?: (error: Error) => void;
  private seekResolve?: () => void;
  private seekReject?: (error: Error) => void;
  private sessionUpdateTime: number = 0;
  private disposed: boolean = false;

  private enqueue(action: () => Promise<void>): Promise<void> {
    const result = this.actions.then(() => {
      if (this.disposed) throw new Error('Player module has been disposed');
      return action();
    });
    this.actions = result.catch(() => {});
    return result;
  }

  private requirePlayer(): media.AVPlayer {
    if (!this.player) throw new Error('Call setupPlayer before using the player');
    return this.player;
  }

  private emitState(state: PlayerState): void {
    this.state = state;
    this.ctx.rnInstance.emitDeviceEvent('playback-state', { state });
    this.publishPlaybackState();
  }

  private publishPlaybackState(): void {
    const session = this.session;
    if (!session) return;
    const sessionState = this.state === PlayerState.Playing ? avSession.PlaybackState.PLAYBACK_STATE_PLAY :
      this.state === PlayerState.Stopped ? avSession.PlaybackState.PLAYBACK_STATE_STOP :
      this.state === PlayerState.Buffering || this.state === PlayerState.Connecting ?
        avSession.PlaybackState.PLAYBACK_STATE_BUFFERING : avSession.PlaybackState.PLAYBACK_STATE_PAUSE;
    const playback: avSession.AVPlaybackState = {
      state: sessionState,
      speed: this.rate,
      position: { elapsedTime: Math.max(0, this.player?.currentTime ?? 0), updateTime: Date.now() },
      loopMode: this.repeatMode === 1 ? avSession.LoopMode.LOOP_MODE_SINGLE :
        this.repeatMode === 2 ? avSession.LoopMode.LOOP_MODE_LIST : avSession.LoopMode.LOOP_MODE_SEQUENCE,
    };
    this.sessionUpdates = this.sessionUpdates.then(() => session.setAVPlaybackState(playback))
      .catch((error: Error) => this.ctx.logger.warn(error.message));
  }

  private reportError(error: Error): void {
    this.prepareReject?.(error);
    this.seekReject?.(error);
    this.emitState(PlayerState.Stopped);
    this.ctx.rnInstance.emitDeviceEvent('playback-error', { code: 'harmony-player', message: error.message });
    this.stopBackground().catch((failure: Error) => this.ctx.logger.warn(failure.message));
  }

  setupPlayer(optionsJson: string): Promise<void> {
    return this.enqueue(async () => {
      if (this.player) return;
      const options = JSON.parse(optionsJson) as PlayerOptions;
      this.autoUpdateMetadata = options.autoUpdateMetadata !== false;
      const session = await avSession.createAVSession(this.ctx.uiAbilityContext, 'LX Music', 'audio');
      try {
        const player = await media.createAVPlayer();
        this.player = player;
        this.session = session;
        player.audioInterruptMode = options.handleAudioFocus === false ? audio.InterruptMode.INDEPENDENT_MODE : audio.InterruptMode.SHARE_MODE;
        player.on('stateChange', (state: string) => {
          if (state === 'initialized') {
            player.audioRendererInfo = { usage: audio.StreamUsage.STREAM_USAGE_MUSIC, rendererFlags: 0 };
            player.prepare().catch((error: Error) => this.reportError(error));
          } else if (state === 'prepared') {
            player.setVolume(this.volume);
            player.setPlaybackRate(this.rate);
            this.emitState(PlayerState.Ready);
            this.prepareResolve?.();
          } else if (state === 'playing') {
            this.emitState(PlayerState.Playing);
          } else if (state === 'paused') {
            this.emitState(PlayerState.Paused);
          } else if (state === 'stopped') {
            this.emitState(PlayerState.Stopped);
          } else if (state === 'completed') {
            this.enqueue(() => this.handleCompletion()).catch((error: Error) => this.reportError(error));
          }
        });
        player.on('error', (error: BusinessError) => this.reportError(new Error(`${error.code}: ${error.message}`)));
        player.on('seekDone', () => this.seekResolve?.());
        player.on('timeUpdate', () => {
          if (Date.now() - this.sessionUpdateTime < 1000) return;
          this.sessionUpdateTime = Date.now();
          this.publishPlaybackState();
        });
        player.on('bufferingUpdate', (type: media.BufferingInfoType, value: number) => {
          if (type === media.BufferingInfoType.BUFFERING_START) this.emitState(PlayerState.Buffering);
          if (type === media.BufferingInfoType.BUFFERING_END) {
            this.emitState(player.state === 'playing' ? PlayerState.Playing : PlayerState.Paused);
          }
          if (type === media.BufferingInfoType.CACHED_DURATION) {
            this.bufferedSeconds = Math.min(player.duration / 1000, (player.currentTime + value) / 1000);
          }
        });
        player.on('audioInterrupt', (event: audio.InterruptEvent) => {
          if (event.hintType === audio.InterruptHint.INTERRUPT_HINT_PAUSE ||
            event.hintType === audio.InterruptHint.INTERRUPT_HINT_STOP) {
            this.pause().catch((error: Error) => this.ctx.logger.warn(error.message));
          }
        });
        this.registerRemoteControls(session);
        await session.activate();
      } catch (error) {
        await this.player?.release();
        this.player = undefined;
        this.session = undefined;
        await session.destroy();
        throw new Error((error as Error).message);
      }
    });
  }

  private registerRemoteControls(session: avSession.AVSession): void {
    session.on('play', () => this.emitRemote(0, 'remote-play'));
    session.on('pause', () => this.emitRemote(3, 'remote-pause'));
    session.on('stop', () => this.emitRemote(4, 'remote-stop'));
    session.on('playNext', () => this.emitRemote(7, 'remote-next'));
    session.on('playPrevious', () => this.emitRemote(8, 'remote-previous'));
    session.on('seek', (milliseconds: number) => {
      if (this.capabilities.includes(5)) {
        this.ctx.rnInstance.emitDeviceEvent('remote-seek', { position: milliseconds / 1000 });
      }
    });
  }

  private emitRemote(capability: number, event: string): void {
    if (this.capabilities.includes(capability)) this.ctx.rnInstance.emitDeviceEvent(event, {});
  }

  private async startBackground(): Promise<void> {
    if (this.backgroundRunning) return;
    const agent = await wantAgent.getWantAgent({
      wants: [{ bundleName: this.ctx.uiAbilityContext.abilityInfo.bundleName, abilityName: 'EntryAbility' }],
      operationType: wantAgent.OperationType.START_ABILITY,
      requestCode: 1,
      wantAgentFlags: [wantAgent.WantAgentFlags.UPDATE_PRESENT_FLAG],
    });
    await backgroundTaskManager.startBackgroundRunning(this.ctx.uiAbilityContext,
      backgroundTaskManager.BackgroundMode.AUDIO_PLAYBACK, agent);
    this.backgroundRunning = true;
  }

  private async stopBackground(): Promise<void> {
    if (!this.backgroundRunning) return;
    await backgroundTaskManager.stopBackgroundRunning(this.ctx.uiAbilityContext);
    this.backgroundRunning = false;
  }

  private closeSource(): void {
    if (this.localFile) fileIo.closeSync(this.localFile);
    this.localFile = undefined;
    if (this.rawFilePath) this.ctx.uiAbilityContext.resourceManager.closeRawFd(this.rawFilePath);
    this.rawFilePath = undefined;
  }

  private isPlaceholder(): boolean {
    return this.currentIndex >= 0 && (this.queue[this.currentIndex].id ?? '').endsWith('//default');
  }

  private async loadTrack(index: number, isAutomatic: boolean = false): Promise<void> {
    const player = this.requirePlayer();
    if (!Number.isInteger(index) || index < 0 || index >= this.queue.length) throw new Error('Track index out of bounds');
    const previous = this.currentIndex;
    const position = Math.max(0, player.currentTime) / 1000;
    await player.reset();
    this.closeSource();
    this.bufferedSeconds = 0;
    this.currentIndex = index;
    this.ctx.rnInstance.emitDeviceEvent('playback-track-changed', {
      track: previous < 0 ? null : previous, nextTrack: index, position, isAutomatic,
    });
    if (this.isPlaceholder()) {
      this.emitState(PlayerState.Ready);
      await this.stopBackground();
      return;
    }
    this.emitState(PlayerState.Connecting);
    const track = this.queue[index];
    const prepared = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.prepareResolve = undefined;
        this.prepareReject = undefined;
        reject(new Error('Timed out preparing audio'));
      }, 20000);
      this.prepareResolve = () => {
        clearTimeout(timeout);
        this.prepareResolve = undefined;
        this.prepareReject = undefined;
        resolve();
      };
      this.prepareReject = (error: Error) => {
        clearTimeout(timeout);
        this.prepareResolve = undefined;
        this.prepareReject = undefined;
        reject(error);
      };
    });
    try {
      if (/^https?:\/\//.test(track.url)) {
        const headers: Record<string, string> = {};
        if (track.headers) Object.keys(track.headers).forEach((key: string) => { headers[key] = track.headers![key]; });
        if (track.userAgent) headers['User-Agent'] = track.userAgent;
        await player.setMediaSource(media.createMediaSourceWithUrl(track.url, headers));
      } else if (track.url.startsWith('/') || track.url.startsWith('file://')) {
        this.localFile = fileIo.openSync(track.url.startsWith('file://') ? track.url.slice(7) : track.url, fileIo.OpenMode.READ_ONLY);
        player.fdSrc = { fd: this.localFile.fd, offset: 0, length: fileIo.statSync(this.localFile.fd).size };
      } else {
        const path = track.url.replace(/^asset:\/*/, '').replace(/^resource:\/\/RAWFILE\//, '');
        const descriptor = await this.ctx.uiAbilityContext.resourceManager.getRawFd(path);
        this.rawFilePath = path;
        player.fdSrc = descriptor;
      }
    } catch (error) {
      this.prepareReject?.(error as Error);
    }
    await prepared;
    if (this.autoUpdateMetadata) {
      this.metadata = this.mergeMetadata({}, track);
      await this.publishMetadata();
    }
  }

  private async seek(seconds: number): Promise<void> {
    const player = this.requirePlayer();
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Invalid seek position');
    if (this.isPlaceholder() || this.currentIndex < 0) return;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.seekResolve = undefined;
        this.seekReject = undefined;
        reject(new Error('Timed out seeking audio'));
      }, 5000);
      this.seekResolve = () => {
        clearTimeout(timeout);
        this.seekResolve = undefined;
        this.seekReject = undefined;
        this.publishPlaybackState();
        resolve();
      };
      this.seekReject = (error: Error) => {
        clearTimeout(timeout);
        this.seekResolve = undefined;
        this.seekReject = undefined;
        reject(error);
      };
      try {
        player.seek(Math.min(Math.round(seconds * 1000), Math.max(0, player.duration)), media.SeekMode.SEEK_CLOSEST);
      } catch (error) {
        this.seekReject?.(error as Error);
      }
    });
  }

  private async handleCompletion(): Promise<void> {
    const completedIndex = this.currentIndex;
    const position = Math.max(0, this.player?.duration ?? 0) / 1000;
    if (this.repeatMode === 1) {
      await this.seek(0);
      await this.requirePlayer().play();
    } else if (completedIndex + 1 < this.queue.length || this.repeatMode === 2) {
      await this.loadTrack((completedIndex + 1) % this.queue.length, true);
      if (!this.isPlaceholder()) await this.requirePlayer().play();
    } else {
      this.emitState(PlayerState.Stopped);
      await this.stopBackground();
      this.ctx.rnInstance.emitDeviceEvent('playback-queue-ended', { track: completedIndex, position });
    }
  }

  add(tracksJson: string, insertBeforeIndex: number): Promise<void> {
    return this.enqueue(async () => {
      this.requirePlayer();
      const tracks = JSON.parse(tracksJson) as Track[];
      const index = insertBeforeIndex === -1 ? this.queue.length : insertBeforeIndex;
      if (!Number.isInteger(index) || index < 0 || index > this.queue.length) throw new Error('Insert index out of bounds');
      if (tracks.some((track: Track) => !track.url)) throw new Error('Track URL is required');
      this.queue.splice(index, 0, ...tracks);
      if (this.currentIndex >= index) this.currentIndex += tracks.length;
    });
  }

  remove(indexesJson: string): Promise<void> {
    return this.enqueue(async () => {
      const indexes = Array.from(new Set<number>(JSON.parse(indexesJson) as number[])).sort((left, right) => right - left);
      if (indexes.some((index: number) => !Number.isInteger(index) || index < 0 || index >= this.queue.length)) {
        throw new Error('Remove index out of bounds');
      }
      const active = this.queue[this.currentIndex];
      const previousIndex = this.currentIndex;
      const wasPlaying = this.state === PlayerState.Playing;
      indexes.forEach((index: number) => this.queue.splice(index, 1));
      const activeIndex = active ? this.queue.indexOf(active) : -1;
      if (active && activeIndex < 0) {
        if (this.queue.length) {
          await this.loadTrack(Math.min(previousIndex, this.queue.length - 1));
          if (wasPlaying && !this.isPlaceholder()) await this.requirePlayer().play();
        } else {
          await this.resetInternal();
        }
      } else {
        this.currentIndex = activeIndex;
      }
    });
  }

  removeUpcomingTracks(): Promise<void> {
    return this.enqueue(async () => { this.queue.splice(this.currentIndex + 1); });
  }

  skip(index: number): Promise<void> {
    return this.enqueue(async () => {
      const wasPlaying = this.state === PlayerState.Playing;
      await this.loadTrack(index);
      if (wasPlaying && !this.isPlaceholder()) await this.requirePlayer().play();
    });
  }

  skipToNext(): Promise<void> { return this.skip(this.currentIndex + 1); }
  skipToPrevious(): Promise<void> { return this.skip(this.currentIndex - 1); }

  play(): Promise<void> {
    return this.enqueue(async () => {
      const player = this.requirePlayer();
      if (!this.queue.length || this.isPlaceholder() || player.state === 'playing') return;
      if (this.currentIndex < 0 || player.state === 'stopped' || player.state === 'error') {
        await this.loadTrack(Math.max(0, this.currentIndex));
      }
      if (player.state === 'completed') await this.seek(0);
      await this.startBackground();
      try {
        await player.play();
      } catch (error) {
        await this.stopBackground();
        throw new Error((error as Error).message);
      }
    });
  }

  pause(): Promise<void> {
    return this.enqueue(async () => {
      const player = this.requirePlayer();
      if (player.state === 'playing') await player.pause();
      await this.stopBackground();
    });
  }

  stop(): Promise<void> {
    return this.enqueue(async () => {
      const player = this.requirePlayer();
      if (['playing', 'paused', 'prepared', 'completed'].includes(player.state)) await player.stop();
      this.emitState(PlayerState.Stopped);
      await this.stopBackground();
    });
  }

  seekTo(seconds: number): Promise<void> { return this.enqueue(() => this.seek(seconds)); }

  setVolume(volume: number): Promise<void> {
    return this.enqueue(async () => {
      if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new Error('Volume must be between 0 and 1');
      this.volume = volume;
      if (this.player && ['prepared', 'playing', 'paused', 'completed'].includes(this.player.state)) this.player.setVolume(volume);
    });
  }

  setRate(rate: number): Promise<void> {
    return this.enqueue(async () => {
      if (!Number.isFinite(rate) || rate < 0.125 || rate > 4) throw new Error('Unsupported playback rate');
      this.rate = rate;
      if (this.player && ['prepared', 'playing', 'paused', 'completed'].includes(this.player.state)) this.player.setPlaybackRate(rate);
      this.publishPlaybackState();
    });
  }

  setRepeatMode(mode: number): Promise<void> {
    return this.enqueue(async () => {
      if (![0, 1, 2].includes(mode)) throw new Error('Invalid repeat mode');
      this.repeatMode = mode;
      this.publishPlaybackState();
    });
  }

  updateOptions(optionsJson: string): Promise<void> {
    return this.enqueue(async () => {
      const options = JSON.parse(optionsJson) as ControlOptions;
      if (options.capabilities) this.capabilities = options.capabilities;
    });
  }

  private async publishMetadata(): Promise<void> {
    if (!this.session) return;
    const duration = this.metadata.duration ?? Math.max(0, this.player?.duration ?? 0) / 1000;
    const metadata: avSession.AVMetadata = {
      assetId: this.metadata.id || this.queue[this.currentIndex]?.id || 'lxmusic',
      title: this.metadata.title ?? '',
      artist: this.metadata.artist ?? '',
      album: this.metadata.album ?? '',
      duration: Number.isFinite(duration) ? Math.max(0, Math.round(duration * 1000)) : 0,
    };
    if (this.metadata.artwork) metadata.mediaImage = this.metadata.artwork;
    if (this.metadata.lyric) metadata.lyric = this.metadata.lyric;
    await this.session.setAVMetadata(metadata);
  }

  private mergeMetadata(base: TrackMetadata, update: TrackMetadata): TrackMetadata {
    return {
      id: update.id ?? base.id,
      title: update.title ?? base.title,
      artist: update.artist ?? base.artist,
      album: update.album ?? base.album,
      artwork: update.artwork ?? base.artwork,
      duration: update.duration ?? base.duration,
      lyric: update.lyric ?? base.lyric,
    };
  }

  updateMetadataForTrack(index: number, metadataJson: string): Promise<void> {
    return this.enqueue(async () => {
      if (!this.queue[index]) throw new Error('Metadata index out of bounds');
      const track = this.queue[index];
      const updated = this.mergeMetadata(track, JSON.parse(metadataJson) as TrackMetadata);
      track.title = updated.title;
      track.artist = updated.artist;
      track.album = updated.album;
      track.artwork = updated.artwork;
      track.duration = updated.duration;
      track.lyric = updated.lyric;
      if (index === this.currentIndex) {
        this.metadata = updated;
        await this.publishMetadata();
      }
    });
  }

  updateNowPlayingMetadata(metadataJson: string): Promise<void> {
    return this.enqueue(async () => {
      this.metadata = this.mergeMetadata(this.metadata, JSON.parse(metadataJson) as TrackMetadata);
      await this.publishMetadata();
    });
  }

  updateNowPlayingTitles(titlesJson: string): Promise<void> { return this.updateNowPlayingMetadata(titlesJson); }

  clearNowPlayingMetadata(): Promise<void> {
    return this.enqueue(async () => {
      this.metadata = {};
      await this.publishMetadata();
    });
  }

  private async resetInternal(): Promise<void> {
    await this.requirePlayer().reset();
    this.closeSource();
    this.queue = [];
    this.currentIndex = -1;
    this.bufferedSeconds = 0;
    this.metadata = {};
    this.emitState(PlayerState.None);
    await this.stopBackground();
    await this.publishMetadata();
  }

  reset(): Promise<void> { return this.enqueue(() => this.resetInternal()); }
  async getVolume(): Promise<number> { return this.volume; }
  async getRate(): Promise<number> { return this.rate; }
  async getRepeatMode(): Promise<number> { return this.repeatMode; }
  async getQueue(): Promise<string> { return JSON.stringify(this.queue); }
  async getCurrentTrack(): Promise<number> { return this.currentIndex; }
  async getState(): Promise<number> { return this.state; }
  async getDuration(): Promise<number> { return this.isPlaceholder() ? 0 : Math.max(0, this.player?.duration ?? 0) / 1000; }
  async getPosition(): Promise<number> { return this.isPlaceholder() ? 0 : Math.max(0, this.player?.currentTime ?? 0) / 1000; }
  async getBufferedPosition(): Promise<number> { return this.bufferedSeconds; }

  private async release(): Promise<void> {
    await this.stopBackground();
    await this.player?.release();
    this.player = undefined;
    this.closeSource();
    await this.sessionUpdates;
    await this.session?.destroy();
    this.session = undefined;
    this.queue = [];
    this.currentIndex = -1;
    this.state = PlayerState.None;
  }

  destroy(): Promise<void> { return this.enqueue(() => this.release()); }

  __onDestroy__(): void {
    this.disposed = true;
    this.prepareReject?.(new Error('Player disposed'));
    this.seekReject?.(new Error('Player disposed'));
    this.actions.then(() => this.release()).catch((error: Error) => this.ctx.logger.warn(error.message));
    super.__onDestroy__();
  }
}
