import { init as initLyricPlayer, toggleTranslation, toggleRoma, play, pause, stop, setLyric, setPlaybackRate } from '@/core/lyric'
import { updateSetting } from '@/core/common'
import { onDesktopLyricPositionChange, showDesktopLyric, onLyricLinePlay, showRemoteLyric } from '@/core/desktopLyric'
import playerState from '@/store/player/state'
import { updateNowPlayingTitles } from '@/plugins/player/utils'
import { setLastLyric } from '@/core/player/playInfo'
import { state } from '@/plugins/player/playList'

const updateRemoteLyric = async(lrcLines?: string[]) => {
  setLastLyric(lrcLines ? lrcLines.join('\n') : null);
  if (lrcLines == null || lrcLines.length === 0) {
    void updateNowPlayingTitles(
      (state.prevDuration || 0) * 1000,
      playerState.musicInfo.name,
      playerState.musicInfo.singer ?? '',
      playerState.musicInfo.album ?? ''
    );
  } else {
    const formattedLyrics = lrcLines.join('\n');
    void updateNowPlayingTitles(
      (state.prevDuration || 0) * 1000,
      formattedLyrics,
      `${playerState.musicInfo.name}${playerState.musicInfo.singer ? ` - ${playerState.musicInfo.singer}` : ''}`,
      playerState.musicInfo.album ?? ''
    );
  }
};

export default async(setting: LX.AppSetting) => {
  await initLyricPlayer();
  await Promise.all([
    setPlaybackRate(setting['player.playbackRate']),
    toggleTranslation(setting['player.isShowLyricTranslation']),
    toggleRoma(setting['player.isShowLyricRoma']),
  ]);

  if (setting['desktopLyric.enable']) {
    showDesktopLyric().catch(() => {
      updateSetting({ 'desktopLyric.enable': false });
    });
  }
  if (setting['player.isShowBluetoothLyric']) {
    showRemoteLyric(true).catch(() => {
      updateSetting({ 'player.isShowBluetoothLyric': false });
    });
  }
  onDesktopLyricPositionChange(position => {
    updateSetting({
      'desktopLyric.position.x': position.x,
      'desktopLyric.position.y': position.y,
    });
  });
  onLyricLinePlay(({ text, extendedLyrics }) => {
    if (!text && !state.isPlaying) {
      void updateRemoteLyric();
    } else {
      void updateRemoteLyric(extendedLyrics || [text]);
    }
  });

  global.app_event.on('play', play);
  global.app_event.on('pause', pause);
  global.app_event.on('stop', stop);
  global.app_event.on('error', pause);
  global.app_event.on('musicToggled', stop);
  global.app_event.on('lyricUpdated', setLyric);
};
