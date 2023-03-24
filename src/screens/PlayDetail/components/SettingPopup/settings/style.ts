import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingLeft: 15,
    paddingRight: 15,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  // title: {

  // },
  label: {
    width: 40,
    textAlign: 'center',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 5,
  },
})
