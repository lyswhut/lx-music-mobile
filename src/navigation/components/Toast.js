import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useGetter } from '@/store'
import { Navigation } from 'react-native-navigation'


const Toast = ({ componentId }) => {
  const theme = useGetter('common', 'theme')

  return (
    <View style={styles.root}>
      <View style={{ ...styles.toast, backgroundColor: theme.secondary10 }}>
        <Text style={styles.text}>This a very important message!</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Navigation.dismissOverlay(componentId)}
        >
          <Text style={styles.buttonText}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
  toast: {
    elevation: 2,
    flexDirection: 'row',
    height: 40,
    margin: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: 'white',
    fontSize: 16,
    marginLeft: 16,
  },
  button: {
    marginRight: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})

Toast.options = {
  layout: {
    componentBackgroundColor: 'transparent',
  },
  overlay: {
    interceptTouchOutside: false,
  },
}

export default Toast

