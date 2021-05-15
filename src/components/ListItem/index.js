import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import PropTypes from 'prop-types'
import { BorderWidths } from '@/theme'
import { useGetter } from '@/store'

const ListItem = ({ data, onPress, badge }) => {
  const theme = useGetter('common', 'theme')
  return (
    <View style={{ ...styles.container, borderBottomColor: theme.borderColor2, borderBottomWidth: BorderWidths.normal }}>
      <TouchableOpacity style={styles.left} onPress={onPress}>
        <View style={styles.row1}>
          <Text style={styles.title}>{data.title}</Text>
          {!!data.badge && <Text style={[styles.badge, styles[`badge_${badge}`]]}>{data.badge}</Text>}
        </View>
        {!!data.desc && <View style={styles.row2}><Text style={styles.desc}>{data.desc}</Text></View>}
      </TouchableOpacity>
      {!!data.right && <View style={styles.right}>{data.right}</View>}
    </View>
  )
}

// class ListItem extends Component {
//   state = {

//   }

//   static propTypes = {
//     data: PropTypes.object.isRequired,
//     onPress: PropTypes.func,
//   }

//   render() {
//     const { data, onPress, badge } = this.props

//   }
// }

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 16,
  },
  desc: {
    color: '#888',
  },
  badge: {

  },
  right: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    justifyContent: 'center',
  },

})

export default ListItem

