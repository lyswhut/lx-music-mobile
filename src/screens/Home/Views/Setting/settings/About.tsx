import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
// import Button from './components/Button'

import { createStyle, openUrl } from '@/utils/tools'
// import { showPactModal } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { showPactModal } from '@/core/common'

const qqGroupUrl = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3Du1zyxek8roQAwic44nOkBXtG9CfbAxFw'
// const qqGroupUrl2 = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3D-l4kNZ2bPQAuvfCQFFhl1UoibvF5wcrQ'
const qqGroupWebUrl = 'https://qm.qq.com/cgi-bin/qm/qr?k=jRZkyFSZ4FmUuTHA3P_RAXbbUO_Rrn5e&jump_from=webapi'
// const qqGroupWebUrl2 = 'https://qm.qq.com/cgi-bin/qm/qr?k=HPNJEfrZpBZ9T8szYWbe2d5JrAAeOt_l&jump_from=webapi'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const openHomePage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#readme')
  }
  const openNetdiskPage = () => {
    void openUrl('https://www.lanzoui.com/b0bf2cfa/')
  }
  const openFAQPage = () => {
    void openUrl('https://lyswhut.github.io/lx-music-doc/mobile/faq')
  }
  // const openIssuesPage = () => {
  //   openUrl('https://github.com/lyswhut/lx-music-mobile/issues')
  // }
  const openPactModal = () => {
    showPactModal()
  }
  const openPartPage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')
  }

  const goToQQGroup = () => {
    openUrl(qqGroupUrl).catch(() => {
      void openUrl(qqGroupWebUrl)
    })
  }
  // const goToQQGroup2 = () => {
  //   openUrl(qqGroupUrl2).catch(() => {
  //     void openUrl(qqGroupWebUrl2)
  //   })
  // }

  const textLinkStyle = {
    ...styles.text,
    textDecorationLine: 'underline',
    color: theme['c-primary-font'],
    // fontSize: 14,
  } as const


  return (
    <Section title={t('setting_about')}>
      <View style={styles.part}>
        <Text style={styles.text} >本软件完全免费，代码已开源，开源地址：</Text>
        <TouchableOpacity onPress={openHomePage}>
          <Text style={textLinkStyle}>https://github.com/lyswhut/lx-music-mobile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text} >最新版网盘下载地址：</Text>
        <TouchableOpacity onPress={openNetdiskPage}>
          <Text style={textLinkStyle}>网盘地址（密码：glqw）</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text} >软件的常见问题可转至：</Text>
        <TouchableOpacity onPress={openFAQPage}>
          <Text style={textLinkStyle}>常见问题</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>本软件没有客服</Text>，但我们整理了一些常见的使用问题，<Text style={styles.boldText} >仔细 仔细 仔细 </Text>地阅读常见问题后，</Text>
        <Text style={styles.text}>仍有问题可加企鹅群 </Text>
        <TouchableOpacity onPress={goToQQGroup}><Text style={textLinkStyle}>830125506</Text></TouchableOpacity>
        <Text style={styles.text}> 反馈。</Text>
        <Text style={styles.text}>注意：<Text style={styles.boldText}>为免满人，无事勿加，入群先看群公告</Text></Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>目前本项目的原始发布地址只有<Text style={styles.boldText}>GitHub</Text>及<Text style={styles.boldText}>蓝奏网盘</Text>，其他渠道均为第三方转载发布，可信度请自行鉴别。</Text>
        <Text style={styles.text}>本项目无微信公众号之类的官方账号，也未在小米、华为、vivo等应用商店发布同名应用，谨防被骗。</Text>
        <Text style={styles.text}>若你使用过程中遇到<Text style={styles.boldText}>广告</Text>或者<Text style={styles.boldText}>引流</Text>（如需要加群、关注公众号之类才能使用或者升级）的信息，则表明你当前运行的软件是第三方修改版。</Text>
        <Text style={styles.text}>若在升级新版本时提示<Text style={styles.boldText}>签名不一致</Text>，则表明你手机上的旧版本或者将要安装的新版本中有一方是第三方修改版。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>由于软件开发的初衷仅是为了对新技术的学习与研究，因此软件直至停止维护都将会一直保持纯净。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>你已签署本软件的</Text>
        <TouchableOpacity onPress={openPactModal}><Text style={styles.text} color={theme['c-primary-font']}>许可协议</Text></TouchableOpacity>
        <Text style={styles.text}>，协议的在线版本在</Text>
        <TouchableOpacity onPress={openPartPage}><Text style={textLinkStyle}>这里</Text></TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>By：</Text>
        <Text style={styles.text}>落雪无痕</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  throughText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    textAlignVertical: 'bottom',
  },
  btn: {
    flexDirection: 'row',
  },
})
