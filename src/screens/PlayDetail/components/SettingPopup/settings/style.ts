import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingTop: 5,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    alignItems: 'flex-start',
  },
  // title: {

  // },
  label: {
    width: 50,
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
  colorList: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingTop: 5,
  },
  colorItem: {
    padding: 4,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tip: {
    paddingTop: 2,
    paddingLeft: 28,
  },
  tipText: {
    fontSize: 12,
  },
})
