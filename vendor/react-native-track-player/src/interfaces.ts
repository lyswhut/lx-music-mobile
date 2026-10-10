import { NativeModules } from 'react-native'
const { TrackPlayerModule: TrackPlayer } = NativeModules

export enum IOSCategory {
  Playback = 'playback',
  PlayAndRecord = 'playAndRecord',
  MultiRoute = 'multiRoute',
  Ambient = 'ambient',
  SoloAmbient = 'soloAmbient',
  Record = 'record',
}

export enum IOSCategoryMode {
  Default = 'default',
  GameChat = 'gameChat',
  Measurement = 'measurement',
  MoviePlayback = 'moviePlayback',
  SpokenAudio = 'spokenAudio',
  VideoChat = 'videoChat',
  VideoRecording = 'videoRecording',
  VoiceChat = 'voiceChat',
  VoicePrompt = 'voicePrompt',
}

export enum IOSCategoryOptions {
  MixWithOthers = 'mixWithOthers',
  DuckOthers = 'duckOthers',
  InterruptSpokenAudioAndMixWithOthers = 'interruptSpokenAudioAndMixWithOthers',
  AllowBluetooth = 'allowBluetooth',
  AllowBluetoothA2DP = 'allowBluetoothA2DP',
  AllowAirPlay = 'allowAirPlay',
  DefaultToSpeaker = 'defaultToSpeaker',
}

export interface PlayerOptions {
  /**
   * Minimum time in seconds that needs to be buffered.
   */
  minBuffer?: number
  /**
   * Maximum time in seconds that needs to be buffered
   */
  maxBuffer?: number
  /**
   * Time in seconds that should be kept in the buffer behind the current playhead time.
   */
  backBuffer?: number
  /**
   * Minimum time in seconds that needs to be buffered to start playing.
   */
  playBuffer?: number
  /**
   * Maximum cache size in kilobytes.
   */
  maxCacheSize?: number
  /**
   * [AVAudioSession.Category](https://developer.apple.com/documentation/avfoundation/avaudiosession/1616615-category) for iOS.
   * Sets on `play()`.
   */
  iosCategory?: IOSCategory
  /**
   * [AVAudioSession.Mode](https://developer.apple.com/documentation/avfoundation/avaudiosession/1616508-mode) for iOS.
   * Sets on `play()`.
   */
  iosCategoryMode?: IOSCategoryMode
  /**
   * [AVAudioSession.CategoryOptions](https://developer.apple.com/documentation/avfoundation/avaudiosession/1616503-categoryoptions) for iOS.
   * Sets on `play()`.
   */
  iosCategoryOptions?: IOSCategoryOptions[]
  /**
   * Indicates whether the player should automatically delay playback in order to minimize stalling.
   * Defaults to `false`.
   */
  waitForBuffer?: boolean
  /**
   * Whether to handle audio focus.
   * Defaults to `true`.
   */
  handleAudioFocus?: boolean
  /**
   * Whether to enable audio offload.
   * Defaults to `true`.
   */
  audioOffload?: boolean
  /**
   * Indicates whether the player should automatically update now playing metadata data in control center / notification.
   * Defaults to `true`.
   */
  autoUpdateMetadata?: boolean
}

export enum RatingType {
  Heart = TrackPlayer.RATING_HEART,
  ThumbsUpDown = TrackPlayer.RATING_THUMBS_UP_DOWN,
  ThreeStars = TrackPlayer.RATING_3_STARS,
  FourStars = TrackPlayer.RATING_4_STARS,
  FiveStars = TrackPlayer.RATING_5_STARS,
  Percentage = TrackPlayer.RATING_PERCENTAGE,
}

export interface FeedbackOptions {
  /** Marks wether the option should be marked as active or "done" */
  isActive: boolean

  /** The title to give the action (relevant for iOS) */
  title: string
}

export enum Capability {
  Play = TrackPlayer.CAPABILITY_PLAY,
  PlayFromId = TrackPlayer.CAPABILITY_PLAY_FROM_ID,
  PlayFromSearch = TrackPlayer.CAPABILITY_PLAY_FROM_SEARCH,
  Pause = TrackPlayer.CAPABILITY_PAUSE,
  Stop = TrackPlayer.CAPABILITY_STOP,
  SeekTo = TrackPlayer.CAPABILITY_SEEK_TO,
  Skip = TrackPlayer.CAPABILITY_SKIP,
  SkipToNext = TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
  SkipToPrevious = TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
  JumpForward = TrackPlayer.CAPABILITY_JUMP_FORWARD,
  JumpBackward = TrackPlayer.CAPABILITY_JUMP_BACKWARD,
  SetRating = TrackPlayer.CAPABILITY_SET_RATING,
  Like = TrackPlayer.CAPABILITY_LIKE,
  Dislike = TrackPlayer.CAPABILITY_DISLIKE,
  Bookmark = TrackPlayer.CAPABILITY_BOOKMARK,
}

export type ResourceObject = number

export interface MetadataOptions {
  ratingType?: RatingType
  forwardJumpInterval?: number
  backwardJumpInterval?: number

  // ios
  likeOptions?: FeedbackOptions
  dislikeOptions?: FeedbackOptions
  bookmarkOptions?: FeedbackOptions

  capabilities?: Capability[]

  // android
  stopWithApp?: boolean
  alwaysPauseOnInterruption?: boolean
  notificationCapabilities?: Capability[]
  compactCapabilities?: Capability[]

  icon?: ResourceObject
  playIcon?: ResourceObject
  pauseIcon?: ResourceObject
  stopIcon?: ResourceObject
  previousIcon?: ResourceObject
  nextIcon?: ResourceObject
  rewindIcon?: ResourceObject
  forwardIcon?: ResourceObject
  color?: number
}

export enum Event {
  PlaybackState = 'playback-state',
  PlaybackError = 'playback-error',
  PlaybackQueueEnded = 'playback-queue-ended',
  PlaybackTrackChanged = 'playback-track-changed',
  PlaybackMetadataReceived = 'playback-metadata-received',
  RemotePlay = 'remote-play',
  RemotePlayId = 'remote-play-id',
  RemotePlaySearch = 'remote-play-search',
  RemotePause = 'remote-pause',
  RemoteStop = 'remote-stop',
  RemoteSkip = 'remote-skip',
  RemoteNext = 'remote-next',
  RemotePrevious = 'remote-previous',
  RemoteJumpForward = 'remote-jump-forward',
  RemoteJumpBackward = 'remote-jump-backward',
  RemoteSeek = 'remote-seek',
  RemoteSetRating = 'remote-set-rating',
  RemoteDuck = 'remote-duck',
  RemoteLike = 'remote-like',
  RemoteDislike = 'remote-dislike',
  RemoteBookmark = 'remote-bookmark',
}

export enum TrackType {
  Default = 'default',
  Dash = 'dash',
  HLS = 'hls',
  SmoothStreaming = 'smoothstreaming',
}

export enum RepeatMode {
  Off = TrackPlayer.REPEAT_OFF,
  Track = TrackPlayer.REPEAT_TRACK,
  Queue = TrackPlayer.REPEAT_QUEUE,
}

export enum PitchAlgorithm {
  Linear = TrackPlayer.PITCH_ALGORITHM_LINEAR,
  Music = TrackPlayer.PITCH_ALGORITHM_MUSIC,
  Voice = TrackPlayer.PITCH_ALGORITHM_VOICE,
}

export enum State {
  None = TrackPlayer.STATE_NONE,
  Ready = TrackPlayer.STATE_READY,
  Playing = TrackPlayer.STATE_PLAYING,
  Paused = TrackPlayer.STATE_PAUSED,
  Stopped = TrackPlayer.STATE_STOPPED,
  Buffering = TrackPlayer.STATE_BUFFERING,
  Connecting = TrackPlayer.STATE_CONNECTING,
}

export interface TrackMetadataBase {
  title?: string
  album?: string
  artist?: string
  duration?: number
  artwork?: string | ResourceObject
  description?: string
  genre?: string
  date?: string
  rating?: number | boolean
  isLiveStream?: boolean
  lyric?: string
}

export interface NowPlayingMetadata extends TrackMetadataBase {
  elapsedTime?: number
}

export interface NowPlayingTitles {
  title?: string
  artist?: string
  album?: string
  lyric?: string
}

export interface Track extends TrackMetadataBase {
  url: string | ResourceObject
  type?: TrackType
  userAgent?: string
  contentType?: string
  pitchAlgorithm?: PitchAlgorithm
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headers?: { [key: string]: any }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
