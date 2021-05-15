import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as modules from './modules'


const mapDispatchToProps = actionCreators => dispatch => ({
  actions: bindActionCreators(actionCreators, dispatch),
})

export default (mapStateToProps, mapActions) => {
  const mapActionToProps = {}
  for (const [moduleName, actions] of mapActions) {
    const moduleActions = modules[moduleName].action
    if (Array.isArray(actions)) {
      for (const action of actions) mapActionToProps[action] = moduleActions[action]
    } else {
      for (const [key, value] of Object.entries(actions)) {
        mapActionToProps[key] = moduleActions[value]
      }
    }
  }
  return connect(mapStateToProps, mapDispatchToProps(mapActionToProps))
}
