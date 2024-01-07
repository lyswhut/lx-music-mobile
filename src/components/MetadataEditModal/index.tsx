import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import { TEMP_FILE_PATH, createStyle, toast } from '@/utils/tools'
import {
  readMetadata,
  readPic,
  readLyric,
  writeMetadata,
  writePic,
  writeLyric,
} from '@/utils/localMediaMetadata'
import { useUnmounted } from '@/utils/hooks'
import MetadataForm, { defaultData, type Metadata, type MetadataFormType } from './MetadataForm'
import { log } from '@/utils/log'
import { formatPlayTime2 } from '@/utils'
import { unlink } from '@/utils/fs'

export type {
  Metadata,
}

export interface MetadataEditType {
  show: (filePath: string) => void
}
export interface MetadataEditProps {
  onUpdate: (info: Metadata) => void
}


export default forwardRef<MetadataEditType, MetadataEditProps>((props, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const metadataFormRef = useRef<MetadataFormType>(null)
  const filePath = useRef<string>('')
  const metadata = useRef<Metadata>({ ...defaultData })
  const [visible, setVisible] = useState(false)
  const [processing, setProcessing] = useState(false)
  const isUnmounted = useUnmounted()

  const handleShow = (filePath: string) => {
    alertRef.current?.setVisible(true)
    void Promise.all([
      readMetadata(filePath),
      readPic(filePath).catch(() => ''),
      readLyric(filePath, false).catch(() => ''),
    ]).then(async([_metadata, pic, lyric]) => {
      if (!_metadata) return
      if (isUnmounted.current) return
      metadata.current = {
        name: _metadata.name,
        singer: _metadata.singer,
        albumName: _metadata.albumName,
        pic,
        interval: formatPlayTime2(_metadata.interval),
        lyric,
      }
      requestAnimationFrame(() => {
        metadataFormRef.current?.setForm(filePath, metadata.current)
      })
    })
  }
  useImperativeHandle(ref, () => ({
    show(path) {
      filePath.current = path
      if (visible) handleShow(path)
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow(path)
        })
      }
    },
  }))

  const handleUpdate = async() => {
    if (!metadataFormRef.current) return
    let _metadata = metadataFormRef.current.getForm()
    if (!_metadata.name) {
      toast(global.i18n.t('metadata_edit_modal_tip'), 'long')
      return
    }
    setProcessing(true)
    let isUpdated = false
    try {
      if (
        _metadata.name != metadata.current.name ||
        _metadata.singer != metadata.current.singer ||
        _metadata.albumName != metadata.current.albumName
      ) {
        isUpdated ||= true
        await writeMetadata(filePath.current, {
          name: _metadata.name,
          singer: _metadata.singer,
          albumName: _metadata.albumName,
        })
      }
      if (_metadata.pic != metadata.current.pic) {
        isUpdated ||= true
        await writePic(filePath.current, _metadata.pic)
        if (_metadata.pic.startsWith(TEMP_FILE_PATH)) void unlink(_metadata.pic)
      }
      if (_metadata.lyric != metadata.current.lyric) {
        isUpdated ||= true
        await writeLyric(filePath.current, _metadata.lyric)
      }
    } catch (err: any) {
      log.error(`save (${filePath.current}) metadata failed: \n${err.message}`)
      toast(global.i18n.t('metadata_edit_modal_failed'), 'long')
      return
    } finally {
      setProcessing(false)
    }
    if (isUpdated) toast(global.i18n.t('metadata_edit_modal_success'), 'long')
    alertRef.current?.setVisible(false)
    props.onUpdate(_metadata)
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleUpdate}
          confirmText={processing ? global.i18n.t('metadata_edit_modal_processing') : global.i18n.t('metadata_edit_modal_confirm')}
          disabledConfirm={processing}
        >
          <View style={styles.renameContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.title}>{global.i18n.t('metadata_edit_modal_title')}</Text>
            <MetadataForm ref={metadataFormRef} />
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  renameContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
})


