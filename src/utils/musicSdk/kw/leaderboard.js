import { httpFetch } from '../../request'
import { formatPlayTime, decodeName } from '../../index'
import { formatSinger } from './util'

const boardList = [{ id: 'kw__93', name: '酷我飙升榜', bangid: '93' }, { id: 'kw__17', name: '酷我新歌榜', bangid: '17' }, { id: 'kw__16', name: '酷我热歌榜', bangid: '16' }, { id: 'kw__158', name: '抖音热歌榜', bangid: '158' }, { id: 'kw__284', name: '酷我热评榜', bangid: '284' }, { id: 'kw__290', name: 'ACG新歌榜', bangid: '290' }, { id: 'kw__286', name: '台湾KKBOX榜', bangid: '286' }, { id: 'kw__279', name: '春日浅唱榜', bangid: '279' }, { id: 'kw__281', name: '巴士随身听榜', bangid: '281' }, { id: 'kw__255', name: 'KTV点唱榜', bangid: '255' }, { id: 'kw__280', name: '家务进行曲榜', bangid: '280' }, { id: 'kw__282', name: '熬夜修仙榜', bangid: '282' }, { id: 'kw__283', name: '枕边轻音乐榜', bangid: '283' }, { id: 'kw__278', name: '古风音乐榜', bangid: '278' }, { id: 'kw__264', name: 'Vlog音乐榜', bangid: '264' }, { id: 'kw__242', name: '酷我电音榜', bangid: '242' }, { id: 'kw__187', name: '流行趋势榜', bangid: '187' }, { id: 'kw__204', name: '现场音乐榜', bangid: '204' }, { id: 'kw__186', name: 'ACG神曲榜', bangid: '186' }, { id: 'kw__185', name: '最强翻唱榜', bangid: '185' }, { id: 'kw__26', name: '经典怀旧榜', bangid: '26' }, { id: 'kw__104', name: '酷我华语榜', bangid: '104' }, { id: 'kw__182', name: '酷我粤语榜', bangid: '182' }, { id: 'kw__22', name: '酷我欧美榜', bangid: '22' }, { id: 'kw__184', name: '酷我韩语榜', bangid: '184' }, { id: 'kw__183', name: '酷我日语榜', bangid: '183' }, { id: 'kw__145', name: '会员畅听榜', bangid: '145' }, { id: 'kw__153', name: '网红新歌榜', bangid: '153' }, { id: 'kw__64', name: '影视金曲榜', bangid: '64' }, { id: 'kw__176', name: 'DJ嗨歌榜', bangid: '176' }, { id: 'kw__106', name: '酷我真声音', bangid: '106' }, { id: 'kw__12', name: 'Billboard榜', bangid: '12' }, { id: 'kw__49', name: 'iTunes音乐榜', bangid: '49' }, { id: 'kw__180', name: 'beatport电音榜', bangid: '180' }, { id: 'kw__13', name: '英国UK榜', bangid: '13' }, { id: 'kw__164', name: '百大DJ榜', bangid: '164' }, { id: 'kw__246', name: 'YouTube音乐排行榜', bangid: '246' }, { id: 'kw__265', name: '韩国Genie榜', bangid: '265' }, { id: 'kw__14', name: '韩国M-net榜', bangid: '14' }, { id: 'kw__8', name: '香港电台榜', bangid: '8' }, { id: 'kw__15', name: '日本公信榜', bangid: '15' }, { id: 'kw__151', name: '腾讯音乐人原创榜', bangid: '151' }]

export default {
  list: [
    {
      id: 'kwbiaosb',
      name: '飙升榜',
      bangid: 93,
    },
    {
      id: 'kwregb',
      name: '热歌榜',
      bangid: 16,
    },
    {
      id: 'kwhuiyb',
      name: '会员榜',
      bangid: 145,
    },
    {
      id: 'kwdouyb',
      name: '抖音榜',
      bangid: 158,
    },
    {
      id: 'kwqsb',
      name: '趋势榜',
      bangid: 187,
    },
    {
      id: 'kwhuaijb',
      name: '怀旧榜',
      bangid: 26,
    },
    {
      id: 'kwhuayb',
      name: '华语榜',
      bangid: 104,
    },
    {
      id: 'kwyueyb',
      name: '粤语榜',
      bangid: 182,
    },
    {
      id: 'kwoumb',
      name: '欧美榜',
      bangid: 22,
    },
    {
      id: 'kwhanyb',
      name: '韩语榜',
      bangid: 184,
    },
    {
      id: 'kwriyb',
      name: '日语榜',
      bangid: 183,
    },
  ],
  getUrl: (p, l, id) => `http://kbangserver.kuwo.cn/ksong.s?from=pc&fmt=json&pn=${p - 1}&rn=${l}&type=bang&data=content&id=${id}&show_copyright_off=0&pcmp4=1&isbang=1`,
  regExps: {

  },
  limit: 100,
  _requestBoardsObj: null,

  getBoardsData() {
    if (this._requestBoardsObj) this._requestBoardsObj.cancelHttp()
    this._requestBoardsObj = httpFetch('http://qukudata.kuwo.cn/q.k?op=query&cont=tree&node=2&pn=0&rn=1000&fmt=json&level=2')
    return this._requestBoardsObj.promise
  },
  getData(url) {
    const requestDataObj = httpFetch(url)
    return requestDataObj.promise
  },
  filterData(rawList) {
    // console.log(rawList)
    // console.log(rawList.length, rawList2.length)
    return rawList.map((item, inedx) => {
      let formats = item.formats.split('|')
      let types = []
      let _types = {}
      if (formats.includes('MP3128')) {
        types.push({ type: '128k', size: null })
        _types['128k'] = {
          size: null,
        }
      }
      // if (formats.includes('MP3192')) {
      //   types.push({ type: '192k', size: null })
      //   _types['192k'] = {
      //     size: null,
      //   }
      // }
      if (formats.includes('MP3H')) {
        types.push({ type: '320k', size: null })
        _types['320k'] = {
          size: null,
        }
      }
      // if (formats.includes('AL')) {
      //   types.push({ type: 'ape', size: null })
      //   _types.ape = {
      //     size: null,
      //   }
      // }
      if (formats.includes('ALFLAC')) {
        types.push({ type: 'flac', size: null })
        _types.flac = {
          size: null,
        }
      }
      if (formats.includes('HIRFLAC')) {
        types.push({ type: 'flac24bit', size: null })
        _types.flac24bit = {
          size: null,
        }
      }
      // types.reverse()
      return {
        singer: formatSinger(decodeName(item.artist)),
        name: decodeName(item.name),
        albumName: decodeName(item.album),
        albumId: item.albumid,
        songmid: item.id,
        source: 'kw',
        interval: formatPlayTime(parseInt(item.song_duration)),
        img: item.pic,
        lrc: null,
        otherSource: null,
        types,
        _types,
        typeUrl: {},
      }
    })
  },

  filterBoardsData(rawList) {
    // console.log(rawList)
    let list = []
    for (const board of rawList) {
      if (board.source != '1') continue
      list.push({
        id: 'kw__' + board.sourceid,
        name: board.name,
        bangid: String(board.sourceid),
      })
    }
    return list
  },
  async getBoards(retryNum = 0) {
    // if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    // let response
    // try {
    //   response = await this.getBoardsData()
    // } catch (error) {
    //   return this.getBoards(retryNum)
    // }
    // console.log(response.body)
    // if (response.statusCode !== 200 || !response.body.child) return this.getBoards(retryNum)
    // const list = this.filterBoardsData(response.body.child)
    // // console.log(list)
    // console.log(JSON.stringify(list))
    // this.list = list
    // return {
    //   list,
    //   source: 'kw',
    // }
    this.list = boardList
    return {
      list: boardList,
      source: 'kw',
    }
  },

  getList(id, page, retryNum = 0) {
    if (++retryNum > 3) return Promise.reject(new Error('try max num'))
    return this.getData(this.getUrl(page, this.limit, id)).then(({ statusCode, body }) => {
      // console.log(body)
      if (statusCode !== 200 || !body.musiclist) return this.getList(id, page, retryNum)
      // console.log(data1.musiclist, data2.data)
      let total = parseInt(body.num)
      let list = this.filterData(body.musiclist)
      return {
        total,
        list,
        limit: this.limit,
        page,
        source: 'kw',
      }
    })
  },

  // getDetailPageUrl(id) {
  //   return `http://www.kuwo.cn/rankList/${id}`
  // },
}
