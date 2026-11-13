/**
 * 给 Promise 挂超时护栏（QA 2026-10-14 详情页 D-08）：
 * 音源脚本/网络异常时平台取数的 Promise 可能永不 settle，页面就会永远停在
 * 「加载中」——既不报错也不给重试入口。UI 层加限时兜底：
 * 超时只把状态推到既有的 error 分支（页脚自带点击重试），不碰核心取数逻辑；
 * 真数据在超时之后才回来时仍会照常落 state（调用方的 then/catch 语义不变），
 * 属于「先看到可重试、后看到数据」的如实体验，不是脏状态。
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('newui load timeout')), ms)
    void promise.then(
      value => { clearTimeout(timer); resolve(value) },
      error => { clearTimeout(timer); reject(error) },
    )
  })
