/**
 * 给 Promise 挂超时护栏：超时把状态推到既有 error 分支，不碰核心取数逻辑。
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('newui load timeout')), ms)
    void promise.then(
      value => { clearTimeout(timer); resolve(value) },
      error => { clearTimeout(timer); reject(error) },
    )
  })
