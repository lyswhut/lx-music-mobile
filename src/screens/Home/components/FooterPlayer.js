import React from 'react'
import PlayerPortrait from './PlayerPortrait'

const playNextModes = [
  'listLoop',
  'random',
  'list',
  'singleLoop',
]

export default () => <PlayerPortrait playNextModes={playNextModes} />
