import { useImperativeHandle, forwardRef, useState, useCallback, useRef } from 'react'
import { View } from 'react-native'
import { TEMP_FILE_PATH, createStyle, toast } from '@/utils/tools'
import InputItem from './InputItem'
import { useI18n } from '@/lang'
import TextAreaItem from './TextAreaItem'
import PicItem from './PicItem'
import { useTheme } from '@/store/theme/hook'
import ParseName from './ParseName'
import { downloadFile, mkdir, stat } from '@/utils/fs'
import { useUnmounted } from '@/utils/hooks'
import { getLyricInfo, getPicUrl } from '@/core/music/local'
import settingState from '@/store/setting/state'

export interface Metadata {
  name: string // 歌曲名
  singer: string // 艺术家名
  albumName: string // 歌曲专辑名称
  pic: string
  lyric: string
  interval: string
}
export const defaultData = {
  name: '',
  singer: '',
  albumName: '',
  pic: '',
  lyric: '',
  interval: '',
}

export interface MetadataFormType {
  setForm: (path: string, metadata: Metadata) => void
  getForm: () => Metadata
}

const matcheingPic = new Set<string>()
const matcheingLrc = new Set<string>()
export default forwardRef<MetadataFormType, {}>((props, ref) => {
  const t = useI18n()
  const [fileName, setFileName] = useState('')
  const filePath = useRef('')
  const [data, setData] = useState({ ...defaultData })
  const theme = useTheme()
  const isUnmounted = useUnmounted()

  useImperativeHandle(ref, () => ({
    setForm(path, data) {
      filePath.current = path
      // setPath(path)
      void stat(path).then(info => {
        if (isUnmounted.current) return
        setFileName(info.name)
      })
      setData(data)
    },
    getForm() {
      return {
        ...data,
        name: data.name.trim(),
        singer: data.singer.trim(),
        albumName: data.albumName.trim(),
      }
    },
  }))

  const handleUpdateName = useCallback((name: string) => {
    if (name.length > 150) name = name.substring(0, 150)
    setData(data => {
      return { ...data, name }
    })
  }, [])
  const handleUpdateSinger = useCallback((singer: string) => {
    if (singer.length > 150) singer = singer.substring(0, 150)
    setData(data => {
      return { ...data, singer }
    })
  }, [])
  const handleUpdateAlbumName = useCallback((albumName: string) => {
    if (albumName.length > 150) albumName = albumName.substring(0, 150)
    setData(data => {
      return { ...data, albumName }
    })
  }, [])
  const handleOnlineMatchPic = useCallback(() => {
    let path = filePath.current
    if (matcheingPic.has(path)) return
    matcheingPic.add(path)
    void getPicUrl({
      skipFilePic: true,
      musicInfo: {
        id: path,
        interval: data.interval,
        meta: {
          albumName: data.albumName,
          ext: '',
          filePath: path,
          songId: path,
        },
        name: data.name,
        singer: data.singer,
        source: 'local',
      },
      isRefresh: false,
    }).then(async(pic) => {
      if (isUnmounted.current || path != filePath.current) return
      let ext = pic.split('?')[0]
      ext = ext.substring(ext.lastIndexOf('.') + 1)
      if (ext.length > 5) ext = 'jpeg'
      await mkdir(TEMP_FILE_PATH)
      const picPath = `${TEMP_FILE_PATH}/${Math.random().toString().substring(5)}.${ext}`
      return downloadFile(pic, picPath, {
        connectionTimeout: 10000,
        readTimeout: 10000,
      }).promise.then((res) => {
        if (isUnmounted.current || path != filePath.current) return
        toast(t('metadata_edit_modal_form_match_pic_success'))
        setData(data => {
          return { ...data, pic: picPath }
        })
      })
    }).catch((err) => {
      console.log(err)
      if (isUnmounted.current || path != filePath.current) return
      toast(t('metadata_edit_modal_form_match_pic_failed'))
    }).finally(() => {
      matcheingPic.delete(path)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.albumName, data.name, data.singer, t])
  const handleOnlineMatchLyric = useCallback(() => {
    let path = filePath.current
    if (matcheingLrc.has(path)) return
    matcheingLrc.add(path)
    void getLyricInfo({
      skipFileLyric: true,
      musicInfo: {
        id: path,
        interval: data.interval,
        meta: {
          albumName: data.albumName,
          ext: '',
          filePath: path,
          songId: path,
        },
        name: data.name,
        singer: data.singer,
        source: 'local',
      },
      isRefresh: false,
    }).then(async({ lyric, tlyric, rlyric }) => {
      if (isUnmounted.current || path != filePath.current) return
      toast(t('metadata_edit_modal_form_match_lyric_success'))
      let lrc = [
        lyric,
        settingState.setting['player.isShowLyricTranslation'] && tlyric ? tlyric : '',
        settingState.setting['player.isShowLyricRoma'] && rlyric ? rlyric : '',
      ]
      setData(data => {
        return { ...data, lyric: lrc.join('\n\n').trim() }
      })
    }).catch(() => {
      if (isUnmounted.current || path != filePath.current) return
      toast(t('metadata_edit_modal_form_match_lyric_failed'))
    }).finally(() => {
      matcheingLrc.delete(path)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.albumName, data.name, data.singer, t])
  const handleUpdatePic = useCallback((path: string) => {
    setData(data => {
      return { ...data, pic: path }
    })
  }, [])
  const handleUpdateLyric = useCallback((lyric: string) => {
    setData(data => {
      return { ...data, lyric }
    })
  }, [])

  return (
    <View style={styles.container}>
      <TextAreaItem
        value={fileName}
        label={global.i18n.t('metadata_edit_modal_file_name')}
        numberOfLines={2}
        scrollEnabled
        style={{ ...styles.pathText, color: theme['c-primary-font'] }}
      />

      <InputItem
        value={data.name}
        label={t('metadata_edit_modal_form_name')}
        onChanged={handleUpdateName}
        keyboardType="name-phone-pad" />
      <InputItem
        value={data.singer}
        label={t('metadata_edit_modal_form_singer')}
        onChanged={handleUpdateSinger}
        keyboardType="name-phone-pad" />
      <ParseName
        fileName={fileName}
        onNameChanged={handleUpdateName}
        onSingerChanged={handleUpdateSinger}
      />
      <InputItem
        value={data.albumName}
        label={t('metadata_edit_modal_form_album_name')}
        onChanged={handleUpdateAlbumName}
        keyboardType="name-phone-pad" />

      <PicItem
        value={data.pic}
        label={t('metadata_edit_modal_form_pic')}
        onOnlineMatch={handleOnlineMatchPic}
        onChanged={handleUpdatePic} />
      <TextAreaItem
        value={data.lyric}
        label={t('metadata_edit_modal_form_lyric')}
        onOnlineMatch={handleOnlineMatchLyric}
        onChanged={handleUpdateLyric}
        numberOfLines={6}
        keyboardType="default" />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    width: 360,
    maxWidth: '100%',
  },
  pathText: {
    height: 60,
  },
})


