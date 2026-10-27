const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const path = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const compiled = new Map()
const song = id => ({ id, name: id, singer: 'test', meta: {} })
const entry = id => ({ musicInfo: song(id), listId: 'test', isTempPlay: false })

// Run the real selection and history modules; isolate native audio and UI effects.
function createPlayer(ids) {
  const list = ids.map(song)
  const state = { playedList: [], tempPlayList: [], playInfo: {}, playMusicInfo: {}, musicInfo: {} }
  const dislikeInfo = { names: new Set(), musicNames: new Set(), singerNames: new Set() }
  const setting = { 'player.togglePlayMethod': 'random' }
  let random = () => 0
  const mocks = {
    '@/store/player/state': state,
    '@/store/setting/state': { setting },
    '@/store/dislikeList': { state: { dislikeInfo } },
    '@/utils': {},
    '@/utils/tools': { debounceBackgroundTimer: () => () => {} },
    '@/utils/common': { getRandom: (min, max) => Math.floor(random() * (max - min)) + min },
    '@/utils/message': { requestMsg: {} },
    '@/config/constant': { SPLIT_CHAR: { DISLIKE_NAME: '@', DISLIKE_NAME_ALIAS: '#' }, LIST_IDS: {} },
    '@/plugins/player': { isInitialized: () => true, setStop: async() => {} },
    'react-native-background-timer': { clearTimeout() {} },
    '@/core/player/playStatus': {},
    '@/core/music': {},
    '@/core/list': {},
    '@/core/dislikeList': {},
    '@/core/player/playInfo': {
      getList: () => list,
      setPlayListId: listId => { state.playInfo.playerListId = listId },
      setPlayMusicInfo(listId, musicInfo, isTempPlay = false) {
        state.playMusicInfo = { listId, musicInfo, isTempPlay }
        state.playInfo.playerPlayIndex = list.findIndex(m => m.id === musicInfo.id)
      },
    },
  }
  const globals = {
    lx: { isPlayedStop: false },
    app_event: { pause() {} },
    state_event: { playPlayedListChanged() {}, playTempPlayListChanged() {} },
  }
  const modules = new Map()
  function load(relativePath) {
    const filename = path.join(root, relativePath)
    if (modules.has(filename)) return modules.get(filename).exports
    if (!compiled.has(filename)) {
      compiled.set(filename, ts.transpileModule(readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true },
        fileName: filename,
      }).outputText)
    }
    const module = { exports: {} }
    modules.set(filename, module)
    function requireModule(id) {
      if (Object.hasOwn(mocks, id)) return mocks[id]
      const target = id.startsWith('@/')
        ? path.join('src', id.slice(2))
        : path.join(path.dirname(relativePath), id)
      const alias = `@/${target.slice(4).split(path.sep).join('/')}`
      if (Object.hasOwn(mocks, alias)) return mocks[alias]
      return load(`${target}.ts`)
    }
    vm.runInNewContext(compiled.get(filename), {
      module, exports: module.exports, require: requireModule, global: globals, Set, console,
    }, { filename })
    return module.exports
  }
  return {
    state,
    setting,
    list,
    dislikeInfo,
    player: load('src/core/player/player.ts'),
    setRandom(fn) { random = fn },
  }
}

for (const preview of [false, true]) {
  const cases = [
    { name: 'missing current song bypasses history and selects an unplayed candidate', ids: ['A', 'B', 'C', 'D'], current: 2, history: ['A', 'B'], random: 0.99, expected: 'D' },
    { name: 'missing current song preserves the original random candidate pool', ids: ['A', 'B', 'C'], current: 1, history: ['A'], random: 0, expected: 'B' },
    { name: 'found current song follows its next history entry', ids: ['A', 'B', 'C', 'D'], current: 1, history: ['A', 'B', 'C'], random: 0.99, expected: 'C' },
    { name: 'history tail resumes random selection', ids: ['A', 'B', 'C'], current: 1, history: ['A', 'B'], random: 0, expected: 'C' },
    { name: 'empty history retains existing random selection', ids: ['A', 'B'], current: 0, history: [], random: 0, expected: 'A' },
    { name: 'single-song playlist remains playable', ids: ['A'], current: 0, history: ['A'], random: 0, expected: 'A' },
  ]
  for (const scenario of cases) {
    test(`${scenario.name} (preview=${preview})`, async() => {
      const { player, state, setRandom } = createPlayer(scenario.ids)
      await player.playList('test', scenario.current)
      state.playedList = scenario.history.map(entry)
      setRandom(() => scenario.random)
      if (preview) {
        const next = await player.getNextPlayMusicInfo()
        assert.equal(next.musicInfo.id, scenario.expected)
      }
      await player.playNext(true)
      assert.equal(state.playMusicInfo.musicInfo.id, scenario.expected)
    })
  }
}

test('missing current song preserves existing history', async() => {
  const { player, state, setRandom } = createPlayer(['A', 'B', 'C', 'D'])
  await player.playList('test', 2)
  state.playedList = ['A', 'B'].map(entry)
  setRandom(() => 0.99)
  assert.equal((await player.getNextPlayMusicInfo()).musicInfo.id, 'D')
  assert.deepEqual(Array.from(state.playedList, m => m.musicInfo.id), ['A', 'B'])
  await player.playNext(true)
  assert.deepEqual(Array.from(state.playedList, m => m.musicInfo.id), ['A', 'B', 'D'])
})

test('temporary playback can resume from an existing history position', async() => {
  const { player, state } = createPlayer(['A', 'B', 'C'])
  await player.playList('test', 1)
  state.playedList = ['A', 'B', 'C'].map(entry)
  state.playMusicInfo = { musicInfo: song('X'), listId: 'other', isTempPlay: true }
  assert.equal((await player.getNextPlayMusicInfo()).musicInfo.id, 'C')
  await player.playNext(true)
  assert.equal(state.playMusicInfo.musicInfo.id, 'C')
})
