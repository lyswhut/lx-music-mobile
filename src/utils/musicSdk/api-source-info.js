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
		{
			"id": "user_api_667_1702757952644",
			"name": "六音音源",
			"description": "v1.0.7 如失效请前往 www.sixyin.com 下载最新版本",
			"allowShowUpdateAlert": true
		}
]