import React, { useMemo, memo, useState, useEffect } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'

import Section from './components/Section'
// import Button from './components/Button'

import { useTranslation } from '@/plugins/i18n'
import { useGetter, useDispatch } from '@/store'
import { openUrl } from '@/utils/tools'
import { showPactModal } from '@/navigation'

const qqGroupUrl = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3Du1zyxek8roQAwic44nOkBXtG9CfbAxFw'
const qqGroupUrl2 = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3D-l4kNZ2bPQAuvfCQFFhl1UoibvF5wcrQ'
const qqGroupWebUrl = 'https://qm.qq.com/cgi-bin/qm/qr?k=jRZkyFSZ4FmUuTHA3P_RAXbbUO_Rrn5e&jump_from=webapi'
const qqGroupWebUrl2 = 'https://qm.qq.com/cgi-bin/qm/qr?k=HPNJEfrZpBZ9T8szYWbe2d5JrAAeOt_l&jump_from=webapi'

export default memo(() => {
  const theme = useGetter('common', 'theme')
  const { t } = useTranslation()
  const openHomePage = () => {
    openUrl('https://github.com/lyswhut/lx-music-mobile#readme')
  }
  const openNetdiskPage = () => {
    openUrl('https://www.lanzoui.com/b0bf2cfa/')
  }
  const openFAQPage = () => {
    openUrl('https://github.com/lyswhut/lx-music-mobile/blob/master/FAQ.md')
  }
  // const openIssuesPage = () => {
  //   openUrl('https://github.com/lyswhut/lx-music-mobile/issues')
  // }
  const openPactModal = () => {
    showPactModal()
  }
  const openPartPage = () => {
    openUrl('https://github.com/lyswhut/lx-music-mobile#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')
  }

  const goToQQGroup = () => {
    openUrl(qqGroupUrl).catch(() => {
      openUrl(qqGroupWebUrl)
    })
  }
  const goToQQGroup2 = () => {
    openUrl(qqGroupUrl2).catch(() => {
      openUrl(qqGroupWebUrl2)
    })
  }

  const textStyle = StyleSheet.compose(styles.text, {
    color: theme.normal,
  })
  const textLinkStyle = StyleSheet.compose(styles.text, {
    textDecorationLine: 'underline',
    color: theme.secondary,
    fontSize: 14,
  })


  return (
    <Section title={t('setting_about')}>
      <View style={styles.part}>
        <Text style={textStyle} >本软件完全免费，代码已开源，开源地址：</Text>
        <TouchableOpacity onPress={openHomePage}>
          <Text style={textLinkStyle}>https://github.com/lyswhut/lx-music-mobile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={textStyle} >最新版网盘下载地址：</Text>
        <TouchableOpacity onPress={openNetdiskPage}>
          <Text style={textLinkStyle}>网盘地址（密码：glqw）</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={textStyle} >软件的常见问题可转至：</Text>
        <TouchableOpacity onPress={openFAQPage}>
          <Text style={textLinkStyle}>常见问题</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={textStyle}><Text style={{ fontWeight: 'bold' }} >本软件没有客服</Text>，但我们整理了一些常见的使用问题，<Text style={{ fontWeight: 'bold' }} >仔细 仔细 仔细 </Text>地阅读常见问题后，</Text>
        <Text style={textStyle}>仍有问题可加企鹅群 </Text>
        <TouchableOpacity onPress={goToQQGroup}><Text style={textLinkStyle}>830125506</Text></TouchableOpacity>
        <Text style={textStyle}> 反馈。</Text>
        <Text style={textStyle}>注意：<Text style={{ fontWeight: 'bold' }}>为免满人，无事勿加，入群先看群公告</Text></Text>
      </View>
      <View style={styles.part}>
        <Text style={textStyle}>如果你喜欢并经常使用洛雪音乐，并想要第一时间尝鲜洛雪的新功能<Text style={{ textDecorationLine: 'line-through' }}>（当小白鼠）</Text>，</Text>
        <Text style={textStyle}>可以加入测试企鹅群 </Text>
        <TouchableOpacity onPress={goToQQGroup2}><Text style={textLinkStyle}>768786588</Text></TouchableOpacity>
        <Text style={textStyle}>注意：测试版的功可能会不稳定，<Text style={{ fontWeight: 'bold' }}>打算潜水的勿加</Text></Text>
      </View>
      <View style={styles.part}>
        <Text style={textStyle}>由于软件开发的初衷仅是为了对新技术的学习与研究，因此软件直至停止维护都将会一直保持纯净。</Text>
      </View>
      <View style={styles.part}>
        <Text style={textStyle}>你已签署本软件的</Text>
        <TouchableOpacity onPress={openPactModal}><Text style={{ ...styles.text, color: theme.secondary }}>许可协议</Text></TouchableOpacity>
        <Text style={textStyle}>，协议的在线版本在</Text>
        <TouchableOpacity onPress={openPartPage}><Text style={textLinkStyle}>这里</Text></TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={{ ...styles.text, color: theme.normal, fontSize: 12 }}>By：</Text>
        <Text style={textStyle}>落雪无痕</Text>
      </View>
    </Section>
  )
})

const styles = StyleSheet.create({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 13,
    textAlignVertical: 'bottom',
  },
  btn: {
    flexDirection: 'row',
  },
})
