import React, { memo, useCallback, useState, useRef } from 'react'
import { StyleSheet, View, Text, InteractionManager } from 'react-native'
import { readFile, writeFile, temporaryDirectoryPath, unlink } from '@/utils/fs'

import { useGetter, useDispatch } from '@/store'
// import { gzip, ungzip } from 'pako'

import SubTitle from '../components/SubTitle'
import Button from '../components/Button'
import ChoosePath from '@/components/common/ChoosePath'
import { useTranslation } from '@/plugins/i18n'
import { toast } from '@/utils/tools'
import { gzip, ungzip } from '@/utils/gzip'

const lxmFileExt = /\.(json|lxmc)$/

const handleSaveFile = async(path, data) => {
  // if (!path.endsWith('.json')) path += '.json'
  // const buffer = gzip(data)
  const tempFilePath = `${temporaryDirectoryPath}/tempFile.json`
  await writeFile(tempFilePath, data, 'utf8')
  await gzip(tempFilePath, path)
  await unlink(tempFilePath)
}
const handleReadFile = async(path) => {
  let isJSON = path.endsWith('.json')
  let data
  if (isJSON) {
    data = await readFile(path, 'utf8')
  } else {
    const tempFilePath = `${temporaryDirectoryPath}/tempFile.json`
    await ungzip(path, tempFilePath)
    data = await readFile(tempFilePath, 'utf8')
    await unlink(tempFilePath)
  }
  return data
}
const exportList = async(allList, path) => {
  const data = JSON.parse(JSON.stringify({
    type: 'playList',
    data: allList,
  }))
  for (const list of data.data) {
    for (const item of list.list) {
      if (item.otherSource) delete item.otherSource
    }
  }
  await handleSaveFile(path + '/lx_list.lxmc', JSON.stringify(data))
}
const importList = async path => {
  let listData
  try {
    listData = JSON.parse(await handleReadFile(path))
  } catch (error) {
    return
  }
  console.log(listData.type)
  return listData
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

  const onConfirmPath = useCallback(path => {
    setShowChoosePath(false)
    switch (actionTypeRef.current) {
      case 'import_list':
        InteractionManager.runAfterInteractions(() => {
          toast(t('setting_backup_part_import_list_tip_unzip'))
          importList(path).then(listData => {
            // 兼容0.6.2及以前版本的列表数据
            if (listData.type === 'defautlList') {
              setList({ id: 'default', list: listData.data.list, name: '试听列表' })
              toast(t('setting_backup_part_import_list_tip_success'))
              return
            }

            switch (listData.type) {
              case 'playList':
                toast(t('setting_backup_part_import_list_tip_runing'))
                for (const list of listData.data) setList(list)
                toast(t('setting_backup_part_import_list_tip_success'))
                break
              case 'allData':
                toast(t('setting_backup_part_import_list_tip_runing'))
                if (listData.defaultList) { // 兼容pc端 0.6.2及以前版本的列表数据
                  setList({ id: 'default', list: listData.defaultList.list, name: '试听列表' })
                } else {
                  for (const list of listData.playList) setList(list)
                }
                toast(t('setting_backup_part_import_list_tip_success'))
                break

              default: return toast(t('setting_backup_part_import_list_tip_failed'))
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
          exportList(allList, path).then(() => {
            toast(t('setting_backup_part_export_list_tip_success'))
          }).catch(err => {
            console.log(err)
            toast(t('setting_backup_part_export_list_tip_failed'))
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
  }, [allList, setList, t])


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
        filter={lxmFileExt}
        onConfirm={onConfirmPath} />
    </>
  )
})

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
  },
})
