// Support qualitys: 128k 320k flac wav

const sources: Array<{
  id: string
  name: string
  disabled: boolean
  supportQualitys: Partial<Record<LX.OnlineSource, LX.Quality[]>>
}> = [
  {
    id: 'empty',
    name: 'empty',
    disabled: false,
    supportQualitys: {},
  },
  {
    id: 'direct',
    name: '直连接口',
    disabled: false,
    supportQualitys: {
      kw: ['128k'],
      kg: ['128k'],
      tx: ['128k'],
      wy: ['128k'],
      mg: ['128k'],
    },
  },
]

export default sources
