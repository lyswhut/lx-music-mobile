import listState from '@/store/list/state'
import RNFS from 'react-native-fs'

const MY_SONGLIST_PREFIX = 'mysonglist_'

export const getCoverPath = (id: string) =>
  `${RNFS.DocumentDirectoryPath}/lx-music/songlist_covers/${id}.jpg`

/**
 * 确保封面目录存在
 */
export const ensureCoverDir = async () => {
  const dir = `${RNFS.DocumentDirectoryPath}/lx-music/songlist_covers`
  const exists = await RNFS.exists(dir)
  if (!exists) await RNFS.mkdir(dir)
}

/**
 * 创建歌单
 * @param params 歌单参数
 */
export const createMySonglist = async (
  params: { name: string; desc?: string; picUrl?: string; star?: number; position?: number }
) => {
  const id = `${MY_SONGLIST_PREFIX}${Date.now()}`
  const listInfo: LX.List.UserListInfo = {
    id,
    name: params.name,
    desc: params.desc,
    picUrl: params.picUrl,
    star: params.star ?? 0,
    locationUpdateTime: null,
  }
  await global.list_event.list_create(params.position ?? -1, [listInfo])
  return id
}

/**
 * 更新歌单元数据（封面/标题/简介）
 */
export const updateMySonglist = async (
  id: string,
  info: Partial<{ name: string; desc: string; picUrl: string; star: number }>
) => {
  const list = listState.userList.find(l => l.id === id)
  if (!list || !list.id.startsWith(MY_SONGLIST_PREFIX)) return
  await global.list_event.list_update([{ ...list, ...info }])
}

/**
 * 删除歌单（同时删除封面文件 + 列表数据）
 */
export const removeMySonglist = async (id: string) => {
  const coverPath = getCoverPath(id)
  const exists = await RNFS.exists(coverPath)
  if (exists) await RNFS.unlink(coverPath)
  await global.list_event.list_remove([id])
}

/**
 * 获取所有我的歌单
 */
export const getMySonglists = (): LX.List.UserListInfo[] => {
  return listState.userList.filter(l => l.id.startsWith(MY_SONGLIST_PREFIX))
}

/**
 * 判断是否为我的歌单 ID
 */
export const isMySonglistId = (id: string): boolean => {
  return id.startsWith(MY_SONGLIST_PREFIX)
}
