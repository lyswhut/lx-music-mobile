import musicSdk from '@/utils/musicSdk'
import musicDetailApi from '@/utils/musicSdk/wy/musicDetail'
import { weapi } from '@/utils/musicSdk/wy/utils/crypto'
import { httpFetch } from '@/utils/request'
import { formatPlayCount } from '@/utils'

/**
 * 网易歌单详情 weapi 通道（newui 侧运行时补丁，不改 SDK 源文件）。
 *
 * 背景：wy/songList.getListDetail 走 `api/linux/forward`（linuxapi 网关），
 * 网易近期收紧了该网关风控——返回非 200 后重试 3 次抛 'try max num'，
 * 详情页显示「这份歌单暂时取不到内容」。而排行榜一直调
 * `weapi/v3/playlist/detail` 取同一份数据（linux/forward 内部转发的
 * 就是这个接口），完全正常。
 *
 * 做法：包装 songList.getListDetail——tryNum=0 时先走 weapi 一次，
 * 失败再落回原 linuxapi 实现（其内部自带 3 次重试，tryNum>0 直通原实现，
 * 不会回环）。返回结构与原实现逐字段一致（list/page/limit/total/source/info），
 * core/songlist 的分页缓存、toNewMusicInfo、store 合并全部无感。
 */

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36'

const getListDetailWeapi = async(rawId: string, page: number) => {
  const wy = (musicSdk as any).wy.songList
  const { id, cookie } = await wy.getListId(rawId)
  if (cookie) wy.cookie = cookie

  const { statusCode, body: rawBody } = await httpFetch('https://music.163.com/weapi/v3/playlist/detail', {
    method: 'post',
    headers: {
      'User-Agent': UA,
      Cookie: wy.cookie,
    },
    form: weapi({
      id,
      n: wy.limit_song,
      p: 1,
    }),
  }).promise
  // httpFetch 的 body 联合类型是 string | Blob，SDK 侧按 JSON 用（同 songList.js 原样）
  const body = rawBody as any
  if (statusCode !== 200 || body.code !== wy.successCode) throw new Error('weapi list detail failed')

  // 分页口径照抄原实现：limit=1000 切 trackIds，tracks 齐整时本地过滤，
  // 否则逐曲补全（weapi 有时只回 trackIds 不回 tracks）
  const limit = 1000
  const rangeStart = (page - 1) * limit
  let list
  if (body.playlist.tracks && body.playlist.trackIds.length == body.privileges.length) {
    list = wy.filterListDetail(body)
  } else {
    list = (await musicDetailApi.getList(
      body.playlist.trackIds.slice(rangeStart, limit * page).map((trackId: { id: number }) => trackId.id),
    )).list
  }
  return {
    list,
    page,
    limit,
    total: body.playlist.trackIds.length,
    source: 'wy',
    info: {
      play_count: formatPlayCount(body.playlist.playCount),
      name: body.playlist.name,
      img: body.playlist.coverImgUrl,
      desc: body.playlist.description,
      author: body.playlist.creator.nickname,
    },
  }
}

let installed = false
/** 安装 weapi 优先通道（幂等，newui 屏幕注册时调用一次） */
export const installWySonglistDetailWeapi = () => {
  if (installed) return
  const wy = (musicSdk as any).wy?.songList
  if (!wy?.getListDetail) return
  installed = true
  const original = wy.getListDetail.bind(wy)
  wy.getListDetail = async(rawId: string, page: number, tryNum = 0) => {
    // 仅首轮尝试 weapi；原实现的重试链（tryNum>0）直通 linuxapi，不再回环
    if (tryNum === 0) {
      try {
        return await getListDetailWeapi(rawId, page)
      } catch (e) { /* 落回原实现 */ }
    }
    return original(rawId, page, tryNum)
  }
}
