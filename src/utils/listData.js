export const toOldMusicInfo = (minfo) => {
  const oInfo = {
    name: minfo.name,
    singer: minfo.singer,
    source: minfo.source,
    songmid: minfo.meta.songId,
    albumId: minfo.meta.albumId ?? '',
    interval: minfo.interval,
    albumName: minfo.meta.albumName,
    img: minfo.meta.picUrl ?? '',
    types: minfo.meta.qualitys ?? [],
    _types: minfo.meta._qualitys ?? {},
    typeUrl: {},
  }
  switch (minfo.source) {
    case 'kg':
      oInfo.hash = minfo.meta.hash
      break
    case 'tx':
      oInfo.strMediaMid = minfo.meta.strMediaMid
      oInfo.albumMid = minfo.meta.albumMid
      break
    case 'mg':
      oInfo.copyrightId = minfo.meta.copyrightId
      oInfo.lrcUrl = minfo.meta.lrcUrl
      oInfo.mrcUrl = minfo.meta.mrcUrl
      oInfo.trcUrl = minfo.meta.trcUrl
      break
  }

  return oInfo
}
