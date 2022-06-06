import React, { useMemo, useState, useEffect } from 'react'
import { StyleSheet, View, Text, ScrollView, Alert } from 'react-native'
import { Navigation } from 'react-native-navigation'

import Button from '@/components/common/Button'
import { useGetter, useDispatch } from '@/store'
import { openUrl } from '@/utils/tools'
import { exitApp } from '@/utils/common'

const VersionModal = ({ componentId }) => {
  const theme = useGetter('common', 'theme')
  const isAgreePact = useGetter('common', 'isAgreePact')
  const setAgreePact = useDispatch('common', 'setAgreePact')
  const checkVersion = useDispatch('common', 'checkVersion')
  const [time, setTime] = useState(20)

  const handleRejct = () => {
    exitApp()
    // Navigation.dismissOverlay(componentId)
  }

  const handleConfirm = () => {
    if (!isAgreePact) setAgreePact(true)
    Navigation.dismissOverlay(componentId)
    setTimeout(() => {
      Alert.alert(
        '',
        Buffer.from('e69cace8bdafe4bbb6e5ae8ce585a8e5858de8b4b9e4b894e5bc80e6ba90efbc8ce5a682e69e9ce4bda0e698afe88ab1e992b1e8b4ade4b9b0e79a84efbc8ce8afb7e79bb4e68ea5e7bb99e5b7aee8af84efbc810a0a5468697320736f667477617265206973206672656520616e64206f70656e20736f757263652e', 'hex').toString(),
        [{
          text: Buffer.from('e5a5bde79a8420284f4b29', 'hex').toString(),
          onPress: () => {
            checkVersion()
          },
        }],
      )
    }, 2e3)
  }

  const openHomePage = () => {
    openUrl('https://github.com/lyswhut/lx-music-mobile#readme')
  }
  const openLicensePage = () => {
    openUrl('http://www.apache.org/licenses/LICENSE-2.0')
  }

  const textStyle = StyleSheet.compose(styles.text, {
    color: theme.normal,
    marginBottom: 10,
  })
  const textLinkStyle = StyleSheet.compose(styles.text, {
    textDecorationLine: 'underline',
    color: theme.secondary,
    fontSize: 15,
  })

  const confirmBtn = useMemo(() => {
    if (isAgreePact) return { disabled: false, text: '关闭' }
    return time ? { disabled: true, text: `同意（${time}）` } : { disabled: false, text: '同意' }
  }, [isAgreePact, time])

  useEffect(() => {
    if (isAgreePact) return
    const timeoutTools = {
      timeout: null,
      start() {
        this.timeout = setTimeout(() => {
          setTime(time => {
            time--
            if (time > 0) this.start()
            return time
          })
        }, 1000)
      },
      clear() {
        clearTimeout(this.timeout)
      },
    }
    timeoutTools.start()
    return () => timeoutTools.clear()
  }, [])

  return (
    <View style={{ ...styles.centeredView }}>
      <View style={{ ...styles.modalView, backgroundColor: theme.primary }}>
        <View style={{ ...styles.header, backgroundColor: theme.secondary }}></View>
        <View style={styles.main}>
          <Text style={{ ...styles.title, color: theme.normal }}>许可协议</Text>
          <ScrollView style={styles.content} keyboardShouldPersistTaps={'always'}>
              <Text selectable style={textStyle} >本项目（软件）基于 <Text onPress={openLicensePage} style={textLinkStyle}>Apache License 2.0</Text> 许可证发行，在使用本软件前，你（使用者）需签署本协议才可继续使用，以下协议是对于 Apache License 2.0 的补充，如有冲突，以以下协议为准。</Text>
              <Text selectable style={textStyle} >词语约定：本协议中的“本软件”指洛雪音乐移动版项目；“使用者”指签署本协议的使用者；“官方音乐平台”指对本软件内置的包括酷我、酷狗、咪咕等音乐源的官方平台统称；“版权数据”指包括但不限于图像、音频、名字等在内的他人拥有所属版权的数据。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>1.</Text> 本软件的数据来源原理是从各官方音乐平台的公开服务器中拉取数据，经过对数据简单地筛选与合并后进行展示，因此本软件不对数据的准确性负责。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>2.</Text> 使用本软件的过程中可能会产生版权数据，对于这些版权数据，本软件不拥有它们的所有权，为了避免造成侵权，使用者务必在 <Text style={styles.bold}>24小时内</Text> 清除使用本软件的过程中所产生的版权数据。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>3.</Text> 本软件内的官方音乐平台别名为本软件内对官方音乐平台的一个称呼，不包含恶意，如果官方音乐平台觉得不妥，可联系本软件更改或移除。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>4.</Text> 本软件内使用的部分包括但不限于字体、图片等资源来源于互联网，如果出现侵权可联系本软件移除。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>5.</Text> 由于使用本软件产生的包括由于本协议或由于使用或无法使用本软件而引起的任何性质的任何直接、间接、特殊、偶然或结果性损害（包括但不限于因商誉损失、停工、计算机故障或故障引起的损害赔偿，或任何及所有其他商业损害或损失）由使用者负责。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>6.</Text> 本项目完全免费，且开源发布于 <Text onPress={openHomePage} style={textLinkStyle}>GitHub</Text> 面向全世界人用作对技术的学习交流，本软件不对项目内的技术可能存在违反当地法律法规的行为作保证，<Text style={styles.bold}>禁止在违反当地法律法规的情况下使用本软件</Text>，对于使用者在明知或不知当地法律法规不允许的情况下使用本软件所造成的任何违法违规行为由使用者承担，本软件不承担由此造成的任何直接、间接、特殊、偶然或结果性责任。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>*</Text> 若协议更新，恕不另行通知，可到开源地址查看。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>*</Text> 本软件的初衷是帮助官方音乐平台简化数据后代为展示，帮助使用者根据歌曲名、艺术家等关键字快速地定位所需内容所在的音乐平台。</Text>
              <Text selectable style={textStyle} ><Text style={styles.bold}>*</Text> 音乐平台不易，建议到对应音乐平台支持正版资源。</Text>
            {
              isAgreePact
                ? null
                : (
                    <Text selectable style={{ ...styles.text, ...styles.bold, color: theme.normal }} >若你（使用者）接受以上协议，请点击下面的“接受”按钮签署本协议，若不接受，请点击“不接受”后退出软件并清除本软件的所有数据。</Text>
                  )
            }
          </ScrollView>
        </View>
        <View style={styles.btns}>
          {
            isAgreePact
              ? null
              : (
                  <Button style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={handleRejct}>
                    <Text style={{ fontSize: 14, color: theme.secondary_5 }}>不同意</Text>
                  </Button>
                )
          }
          <Button disabled={confirmBtn.disabled} style={{ ...styles.btn, backgroundColor: theme.secondary45 }} onPress={handleConfirm}>
            <Text style={{ fontSize: 14, color: theme.secondary_5 }}>{confirmBtn.text}</Text>
          </Button>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(50,50,50,.3)',
  },
  modalView: {
    maxWidth: '90%',
    minWidth: '75%',
    // minHeight: '36%',
    maxHeight: '78%',
    backgroundColor: 'white',
    borderRadius: 4,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: 'row',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    height: 20,
  },

  main: {
    // flexGrow: 0,
    flexShrink: 1,
    marginTop: 15,
    marginBottom: 20,
  },
  content: {
    flexGrow: 0,
    marginLeft: 5,
    marginRight: 5,
    paddingLeft: 10,
    paddingRight: 10,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
  },
  part: {
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  bold: {
    fontWeight: 'bold',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 15,
    paddingLeft: 15,
    // paddingRight: 15,
  },
  btn: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: 'center',
    borderRadius: 4,
    marginRight: 15,
  },
})

export default VersionModal

