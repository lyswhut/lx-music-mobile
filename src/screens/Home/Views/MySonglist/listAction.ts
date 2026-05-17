import { confirmDialog } from '@/utils/tools'
import { navigations } from '@/navigation'
import { removeMySonglist } from '@/core/mySonglist'
import commonState from '@/store/common/state'

/**
 * 删除歌单（同时清理封面文件）
 */
export const handleRemove = async (id: string) => {
  const confirmed = await confirmDialog({
    message: '确定删除该歌单？歌曲和封面都将被清除。',
  })
  if (!confirmed) return
  await removeMySonglist(id)
}

/**
 * 打开歌单详情页
 */
export const handleOpenDetail = (listId: string) => {
  navigations.pushMySonglistDetailScreen(commonState.componentIds.home!, listId)
}
