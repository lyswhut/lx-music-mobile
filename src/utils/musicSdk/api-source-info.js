// Support qualitys: 128k 320k flac wav

module.exports = [
  {
    id: 'test',
    name: '测试接口',
    disabled: false,
    supportQualitys: {
      kw: ['128k'],
      kg: ['128k'],
      tx: ['128k'],
      wy: ['128k'],
      mg: ['128k'],
      // bd: ['128k'],
    },
  },
  {
    id: 'temp',
    name: '临时接口',
    disabled: false,
    supportQualitys: {
      kw: ['128k'],
    },
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
      mg: ['128k', '320k'],
    },
  },
]
