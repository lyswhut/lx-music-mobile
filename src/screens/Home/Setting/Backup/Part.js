import React, { memo, useCallback, useState, useRef } from 'react'
import { StyleSheet, View, InteractionManager } from 'react-native'
import { log } from '@/utils/log'
import { LXM_FILE_EXT_RXP } from '@/config/constant'

import { useGetter, useDispatch } from '@/store'
// import { gzip, ungzip } from 'pako'

import SubTitle from '../components/SubTitle'
import Button from '../components/Button'
import ChoosePath from '@/components/common/ChoosePath'
import { useTranslation } from '@/plugins/i18n'
import { toast, handleSaveFile, handleReadFile, confirmDialog, showImportTip } from '@/utils/tools'
import { toOldMusicInfo } from '@/utils/listData'

const exportAllList = async(allList, path) => {
  const data = JSON.parse(JSON.stringify({
    type: 'playList',
    data: allList,
  }))
  for (const list of data.data) {
    for (const item of list.list) {
      if (item.otherSource) delete item.otherSource
    }
  }
  try {
    await handleSaveFile(path + '/lx_list.lxmc', data)
  } catch (error) {
    log.error(error.stack)
  }
}
const importAllList = async path => {
  let listData
  try {
    listData = await handleReadFile(path)
  } catch (error) {
    log.error(error.stack)
    return
  }
  console.log(listData.type)
  return listData
}

const handleSetList = (setList, lists) => {
  if (!lists.length) return Promise.resolve()
  const list = lists.shift()
  for (const item of list.list) {
    if (item.otherSource) item.otherSource = null
    if (item.typeUrl['128k']) delete item.typeUrl['128k']
    if (item.typeUrl['320k']) delete item.typeUrl['320k']
    if (item.typeUrl.flac) delete item.typeUrl.flac
    if (item.typeUrl.wav) delete item.typeUrl.wav

    // PC v1.8.2以前的Lyric
    if (item.lxlrc) delete item.lxlrc
    if (item.lrc) delete item.lrc
    if (item.tlrc) delete item.tlrc
  }
  return setList(list).then(() => handleSetList(setList, lists)).catch(err => {
    toast(err.message)
    log.error(err.message)
    return handleSetList(setList, lists)
  })
}

const handleSetListV2 = (setList, lists) => {
  if (!lists.length) return Promise.resolve()
  const list = lists.shift()
  list.list = list.list.map(m => toOldMusicInfo(m))
  return setList(list).then(() => handleSetListV2(setList, lists)).catch(err => {
    toast(err.message)
    log.error(err.message)
    return handleSetListV2(setList, lists)
  })
}

export default memo(() => {
  const { t } = useTranslation()
  const [isShowChoosePath, setShowChoosePath] = useState(false)
  const [title, setTitle] = useState('')
  const [dirOnly, setDirOnly] = useState(false)
  const actionTypeRef = useRef('')
  // const setting = useGetter('common', 'setting')
  const allList = useGetter('list', 'allList')
  const setList = useDispatch('list', 'setList')
  const createUserList = useDispatch('list', 'createUserList')

  const importAndExportData = useCallback(async(action, type) => {
    setDirOnly(action == 'export')
    actionTypeRef.current = `${action}_${type}`
    switch (type) {
      case 'list':
        setTitle(t(`setting_backup_part_${action}_list_desc`))
        break
      case 'setting':
        setTitle(t(`setting_backup_part_${action}_setting_desc`))
        break
      default:
        setTitle(t(`setting_backup_all_${action}_desc`))
        break
    }

    setShowChoosePath(true)
  }, [t])

  const handleImportPartList = useCallback(async(listData, isV2) => {
    const targetList = global.allList[listData.data.id]
    if (targetList) {
      const confirm = await confirmDialog({
        message: t('list_import_part_confirm', { importName: listData.data.name, localName: targetList.name }),
        cancelButtonText: t('list_import_part_button_cancel'),
        confirmButtonText: t('list_import_part_button_confirm'),
        bgClose: false,
      })
      if (confirm) {
        listData.data.name = targetList.name
        setList({
          name: listData.data.name,
          id: listData.data.id,
          list: isV2 ? listData.data.list.map(m => toOldMusicInfo(m)) : listData.data.list,
          source: listData.data.source,
          sourceListId: listData.data.sourceListId,
        })
        toast(t('setting_backup_part_import_list_tip_success'))
        return
      }
      listData.data.id += `__${Date.now()}`
    }
    createUserList({
      name: listData.data.name,
      id: listData.data.id,
      list: isV2 ? listData.data.list.map(m => toOldMusicInfo(m)) : listData.data.list,
      source: listData.data.source,
      sourceListId: listData.data.sourceListId,
      // position: Math.max(selectedListRef.current.index, -1),
    })
    toast(t('setting_backup_part_import_list_tip_success'))
  }, [createUserList, setList, t])

  const onConfirmPath = useCallback(path => {
    setShowChoosePath(false)
    switch (actionTypeRef.current) {
      case 'import_list':
        InteractionManager.runAfterInteractions(() => {
          toast(t('setting_backup_part_import_list_tip_unzip'))
          importAllList(path).then(listData => {
            // 兼容0.6.2及以前版本的列表数据
            if (listData.type === 'defautlList') {
              handleSetList(setList, [
                { id: 'default', list: listData.data.list, name: '试听列表' },
              ]).then(() => {
                toast(t('setting_backup_part_import_list_tip_success'))
              })
              return
            }

            switch (listData.type) {
              case 'playList':
                toast(t('setting_backup_part_import_list_tip_runing'))
                handleSetList(setList, listData.data).then(() => {
                  toast(t('setting_backup_part_import_list_tip_success'))
                })
                break
              case 'allData':
                toast(t('setting_backup_part_import_list_tip_runing'))
                if (listData.defaultList) { // 兼容pc端 0.6.2及以前版本的列表数据
                  handleSetList(setList, [
                    { id: 'default', list: listData.defaultList.list, name: '试听列表' },
                  ]).then(() => {
                    toast(t('setting_backup_part_import_list_tip_success'))
                  })
                } else {
                  handleSetList(setList, listData.playList).then(() => {
                    toast(t('setting_backup_part_import_list_tip_success'))
                  })
                }
                toast(t('setting_backup_part_import_list_tip_success'))
                break

              case 'playListPart':
                handleImportPartList(listData, false)
                break
              case 'playList_v2':
                toast(t('setting_backup_part_import_list_tip_runing'))
                handleSetListV2(setList, listData.data).then(() => {
                  toast(t('setting_backup_part_import_list_tip_success'))
                })
                break
              case 'allData_v2':
                toast(t('setting_backup_part_import_list_tip_runing'))
                handleSetListV2(setList, listData.playList).then(() => {
                  toast(t('setting_backup_part_import_list_tip_success'))
                })
                break
              case 'playListPart_v2':
                handleImportPartList(listData, true)
                break

              default: return showImportTip(listData.type)
            }
          })
        })
        break
      // case 'import_setting':
      //   setTitle(t('setting_backup_part_import_setting_desc'))
      //   break
      // case 'import_all':
      //   setTitle(t('setting_backup_part_import_setting_desc'))
      //   break
      case 'export_list':
        InteractionManager.runAfterInteractions(() => {
          toast(t('setting_backup_part_export_list_tip_zip'))
          exportAllList(allList, path).then(() => {
            toast(t('setting_backup_part_export_list_tip_success'))
          }).catch(err => {
            log.error(err.message)
            toast(t('setting_backup_part_export_list_tip_failed') + ': ' + err.message)
          })
        })
        break
      // case 'export_setting':
      //   setTitle(t('setting_backup_part_import_setting_desc'))
      //   break
      // case 'export_all':
      //   setTitle(t('setting_backup_part_import_setting_desc'))
      //   break
      // default:
      //   setTitle(t('setting_backup_all_import_desc'))
      //   break
    }
  }, [allList, handleImportPartList, setList, t])


  return (
    <>
      <SubTitle title={t('setting_backup_part')}>
        <View style={styles.list}>
          <Button onPress={() => importAndExportData('import', 'list')}>{t('setting_backup_part_import_list')}</Button>
          <Button onPress={() => importAndExportData('export', 'list')}>{t('setting_backup_part_export_list')}</Button>
          {/* <Button onPress={() => importAndExportData('import', 'setting')}>{t('setting_backup_part_import_setting')}</Button>
          <Button onPress={() => importAndExportData('export', 'setting')}>{t('setting_backup_part_export_setting')}</Button> */}
        </View>
      </SubTitle>
      {/* <SubTitle title={t('setting_backup_all')}>
        <View style={styles.list}>
          <Button onPress={() => importAndExportData('import', 'all')}>{t('setting_backup_all_import')}</Button>
          <Button onPress={() => importAndExportData('export', 'all')}>{t('setting_backup_all_export')}</Button>
        </View>
      </SubTitle> */}
      <ChoosePath
        visible={isShowChoosePath}
        hide={() => setShowChoosePath(false)}
        title={title}
        dirOnly={dirOnly}
        filter={LXM_FILE_EXT_RXP}
        onConfirm={onConfirmPath} />
    </>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
  },
})
