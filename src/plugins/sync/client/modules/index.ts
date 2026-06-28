import * as list from './list'
import * as dislike from './dislike'
import * as statistics from './statistics'
// export * as theme from './theme'


export const callObj = Object.assign({},
  list.handler,
  dislike.handler,
  statistics.handler,
)


export const modules = {
  list,
  dislike,
  statistics,
}

export const featureVersion = {
  list: 1,
  dislike: 1,
  statistics: 1,
} as const
