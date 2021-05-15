import * as actions from './action'
import * as getter from './getter'

const { STATUS, ...action } = actions

export { action, getter, STATUS }
export { default as reducer } from './reducer'
