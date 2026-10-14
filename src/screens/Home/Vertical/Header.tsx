import { View, TouchableOpacity } from 'react-native'
import { useNavActiveId, useStatusbarHeight } from '@/store/common/hook'
import { useI18n } from '@/lang'
import { createStyle } from '@/utils/tools'
import Text from '@/components/common/Text'
import StatusBar from '@/components/common/StatusBar'
import { useSettingValue } from '@/store/setting/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { HEADER_HEIGHT } from '@/config/constant'
import { type InitState as CommonState } from '@/store/common/state'
import SearchTypeSelector from '@/screens/Home/Views/Search/SearchTypeSelector'
import SonglistSortTab from '@/screens/Home/Views/SongList/HeaderBar/SortTab'
import OpenList from '@/screens/Home/Views/SongList/HeaderBar/OpenList'
import CreateListButton from '@/screens/Home/Views/Mylist/CreateListButton'
import AddLocalButton from '@/screens/Home/Views/Mylist/AddLocalButton'

const headerComponents: Partial<Record<CommonState['navActiveId'], React.ReactNode>> = {
  nav_search: <SearchTypeSelector />,
  nav_songlist: <SonglistSortTab onSortChange={(id) => { global.app_event.songlistSortChanged?.(id) }} />,
  nav_love: (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <CreateListButton />
      <AddLocalButton />
      <OpenList />
    </View>
  ),
}


// const LeftTitle = () => {
//   const id = useNavActiveId()
//   const t = useI18n()

//   return <Text style={styles.leftTitle} size={18}>{t(id)}</Text>
// }
const LeftHeader = () => {
  const id = useNavActiveId()
  const t = useI18n()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
    }}>
      <View style={styles.left}>
        <Text style={styles.leftTitle} size={18}>{t(id)}</Text>
      </View>
      {headerComponents[id] ?? null}
    </View>
  )
}


// const RightTitle = () => {
//   const id = useNavActiveId()
//   const t = useI18n()

//   return <Text style={styles.rightTitle} size={18}>{t(id)}</Text>
// }
const RightHeader = () => {
  const t = useI18n()
  const id = useNavActiveId()
  const statusBarHeight = useStatusbarHeight()

  return (
    <View style={{
      ...styles.container,
      height: scaleSizeH(HEADER_HEIGHT) + statusBarHeight,
      paddingTop: statusBarHeight,
    }}>
      <View style={styles.left}>
        <Text style={styles.rightTitle} size={18}>{t(id)}</Text>
      </View>
      {headerComponents[id] ?? null}
    </View>
  )
}

const Header = () => {
  const drawerLayoutPosition = useSettingValue('common.drawerLayoutPosition')

  return (
    <>
      <StatusBar />
      {
        drawerLayoutPosition == 'left'
          ? <LeftHeader />
          : <RightHeader />
      }

    </>
  )
}


const styles = createStyle({
  container: {
    // width: '100%',
    paddingRight: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 15,
    alignItems: 'center',
    height: '100%',
  },
  leftTitle: {
    paddingLeft: 0,
    paddingRight: 16,
  },
  rightTitle: {
    paddingLeft: 16,
    paddingRight: 16,
  },
})

export default Header