import React, { Component } from 'react'
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Button from '@/components/common/Button'

import { STATUS } from '@/store/modules/player'

import { connect } from '@/store'

import { AppColors, BorderWidths } from '@/theme'

import PlayerPortrait from './PlayerPortrait'
import PlayerLandscape from './PlayerLandscape'

const playNextModes = [
  'listLoop',
  'random',
  'list',
  'singleLoop',
]

const mapStateToProps = state => ({
  homeViewPageIndex: state.common.nav.homeViewPageIndex,
  common: state.common,
  player: state.player,
})

const actions = [
  ['common', ['updateNavHomeViewPageIndex', 'setPlayNextMode']],
  ['player', ['playPrev', 'playNext', 'pauseMusic', 'playMusic']],
]

let timeout

class Header extends Component {
  state = {
    menu: [
      {
        icon: 'search-2',
        name: '搜索',
      },
      {
        icon: 'album',
        name: '歌单',
      },
      // {
      //   icon: 'leaderboard',
      //   name: '榜单',
      // },
      {
        icon: 'love',
        name: '收藏',
      },
      // {
      //   icon: 'download-2',
      //   name: '下载',
      // },
      {
        icon: 'setting',
        name: '设置',
      },
    ],
    asideWidth: 40,
    orientation: 'portrait',
  }

  componentDidMount() {
    const window = Dimensions.get('window')
    this.setState({
      orientation: window.width > window.height ? 'landscape' : 'portrait',
    })
  }

  handleLayout = event => {
    const { width } = event.nativeEvent.layout
    const window = Dimensions.get('window')

    this.setState({
      asideWidth: width,
      orientation: window.width > window.height ? 'landscape' : 'portrait',
    })
  }

  toggleNextPlayMode = () => {
    let index = playNextModes.indexOf(this.props.common.setting.player.togglePlayMethod)
    if (++index >= playNextModes.length) index = -1
    this.props.actions.setPlayNextMode(playNextModes[index] || '')
  }

  handlePress = (item, index) => {
    // console.log(item)
    this.props.actions.updateNavHomeViewPageIndex(index)
    // console.log(this.props.homeViewPageIndex)
  }

  render() {
    let targetMusic = this.props.player.listInfo.list[this.props.player.playIndex]
    if (timeout) {
      clearInterval(timeout)
      timeout = null
    }
    if (!targetMusic) {
      targetMusic = {
        img: null,
        name: '~v~',
        singer: '~',
      }
    }
    // if (!targetMusic.img) {
    //   timeout = setInterval(() => {
    //     let musicInfo = this.props.player.listInfo.list[this.props.player.playIndex]
    //     if (musicInfo.img) {
    //       musicInfo.img
    //     }
    //   }, 1000)
    // }

    let playModeIcon = null
    switch (this.props.common.setting.player.togglePlayMethod) {
      case 'listLoop':
        playModeIcon = 'list-loop'
        break
      case 'random':
        playModeIcon = 'list-random'
        break
      case 'list':
        playModeIcon = 'list-order'
        break
      case 'singleLoop':
        playModeIcon = 'single-loop'
        break
      default:
        playModeIcon = 'single'
        break
    }

    let playIcon = this.props.player.status === STATUS.playing ? 'pause' : 'play'
    // console.log(this.state.orientation)

    const playerProps = {
      asideWidth: this.state.asideWidth,
      targetMusic,
      playIcon,
      playModeIcon,
      actions: this.props.actions,
      menu: this.state.menu,
      homeViewPageIndex: this.props.homeViewPageIndex,
      togglePlay: () => {
        switch (this.props.player.status) {
          case STATUS.playing:
            this.props.actions.pauseMusic()
            break
          case STATUS.pause:
            this.props.actions.playMusic()
            break
          default:
            this.props.actions.playMusic(this.props.player.playIndex)
            break
        }
      },
      toggleNextPlayMode: () => {
        this.toggleNextPlayMode()
      },
    }

    return this.state.orientation == 'portrait'
      ? <PlayerPortrait {...playerProps} onLayout={this.handleLayout} navPress={this.handlePress} />
      : <PlayerLandscape {...playerProps} onLayout={this.handleLayout} navPress={this.handlePress} />
  }
}

export default connect(mapStateToProps, actions)(Header)
