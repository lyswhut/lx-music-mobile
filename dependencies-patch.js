// 在安装依赖后校验并接入播放器音效工厂
const fs = require('node:fs')
const path = require('node:path')

const patches = [
  {
    file: 'node_modules/react-native-track-player/android/build.gradle',
    from: '    // ExoPlayer Core',
    to: "    implementation project(':lx-sound-effects')\n\n    // ExoPlayer Core",
  },
  {
    file: 'node_modules/react-native-track-player/android/src/main/java/com/guichaguri/trackplayer/service/MusicManager.java',
    from: 'DefaultRenderersFactory renderersFactory = new DefaultRenderersFactory(service);',
    to: 'DefaultRenderersFactory renderersFactory = new cn.toside.music.effects.SoundEffectRenderersFactory(service);',
  },
  {
    file: 'node_modules/react-native-track-player/android/src/main/java/com/guichaguri/trackplayer/service/MusicManager.java',
    from: 'player.setTrackSelectionParameters(trackSelectionParameters);',
    to: 'player.setTrackSelectionParameters(trackSelectionParameters);\n        cn.toside.music.effects.SoundEffects.attachPlayer(player, shouldEnableAudioOffload);',
  },
  {
    file: 'node_modules/react-native-track-player/android/src/main/java/com/guichaguri/trackplayer/service/player/ExoPlayback.java',
    from: '        player.release();',
    to: '        cn.toside.music.effects.SoundEffects.detachPlayer(player);\n        player.release();',
  },
]

for (const patch of patches) {
  const file = path.join(__dirname, patch.file)
  const text = fs.readFileSync(file, 'utf8')
  const replacement = patch.to.replace(/\n/g, text.includes('\r\n') ? '\r\n' : '\n')
  if (text.includes(replacement)) continue
  if (!text.includes(patch.from)) throw new Error('Player dependency changed; review sound effect integration: ' + patch.file)
  fs.writeFileSync(file, text.replace(patch.from, replacement))
}
