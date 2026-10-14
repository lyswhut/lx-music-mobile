import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, ScrollView } from 'react-native'

import CurrentTagBtn, { type CurrentTagBtnType } from './CurrentTagBtn'
import { type Source, type TagInfo } from '@/store/songlist/state'
import { getTags } from '@/core/songlist'
import { useI18n } from '@/lang'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import commonState, { type InitState as CommonState } from '@/store/common/state'

export interface TagProps {
  onTagChange: (name: string, id: string) => void
}

export interface TagType {
  setSelectedTagInfo: (source: Source, name: string, activeId: string) => void
}

interface TagCategory {
  name: string
  list: TagInfoItem[]
}

interface TagInfoItem {
  name: string
  id: string
  parent_id: string
  parent_name: string
  source: Source
}

export default forwardRef<TagType, TagProps>(({ onTagChange }, ref) => {
  const currentTagBtnRef = useRef<CurrentTagBtnType>(null)
  const tagInfoRef = useRef<{ source: Source, activeId: string }>({ source: 'kw', activeId: '' })
  const [categories, setCategories] = useState<TagCategory[]>([])
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)
  const [activeTagId, setActiveTagId] = useState('')
  const theme = useTheme()
  const t = useI18n()
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
    }
  }, [])

  useEffect(() => {
    const handleChange = (name: string, id: string) => {
      onTagChange(name, id)
      tagInfoRef.current.activeId = id
      setActiveTagId(id)
      currentTagBtnRef.current?.setCurrentTagInfo(name)
    }

    global.app_event.on('songlistTagInfoChange', handleChange)
    return () => {
      global.app_event.off('songlistTagInfoChange', handleChange)
    }
  }, [onTagChange])

  useImperativeHandle(ref, () => ({
    setSelectedTagInfo(source, name, activeId) {
      tagInfoRef.current.activeId = activeId
      tagInfoRef.current.source = source
      setActiveTagId(activeId)
      currentTagBtnRef.current?.setCurrentTagInfo(name)
      loadTags(source, activeId)
    },
  }))

  const loadTags = (source: Source, activeId: string) => {
    setCategories([{ name: '', list: [{ name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }] }])
    void getTags(source).then(tagInfo => {
      if (isUnmountedRef.current) return
      const cats: TagCategory[] = [
        { name: '', list: [{ name: t('songlist_tag_default'), id: '', parent_id: '', parent_name: '', source }] },
        { name: t('songlist_tag_hot'), list: [...tagInfo.hotTag] },
        ...tagInfo.tags,
      ].filter(c => c.list.length)
      setCategories(cats)
      setActiveCategoryIndex(0)
    })
  }

  const handleTagChange = (item: TagInfoItem) => {
    onTagChange(item.name, item.id)
    tagInfoRef.current.activeId = item.id
    setActiveTagId(item.id)
    currentTagBtnRef.current?.setCurrentTagInfo(item.name)
  }

  const handleCategoryChange = (index: number) => {
    setActiveCategoryIndex(index)
    const first = categories[index]?.list[0]
    if (!first || activeTagId === first.id) return
    handleTagChange(first)
  }

  const categoriesRef = useRef<TagCategory[]>(categories)
  categoriesRef.current = categories
  const onTagChangeRef = useRef(onTagChange)
  onTagChangeRef.current = onTagChange

  // 从其他页面切回歌单时，两个标签行恢复默认选中第一个
  useEffect(() => {
    let prevNavId: CommonState['navActiveId'] = commonState.navActiveId
    const handleNavUpdate = (id: CommonState['navActiveId']) => {
      const wasSonglist = prevNavId == 'nav_songlist'
      prevNavId = id
      if (id != 'nav_songlist' || wasSonglist) return
      setActiveCategoryIndex(0)
      const first = categoriesRef.current[0]?.list[0]
      if (!first || tagInfoRef.current.activeId === first.id) return
      onTagChangeRef.current(first.name, first.id)
      tagInfoRef.current.activeId = first.id
      setActiveTagId(first.id)
      currentTagBtnRef.current?.setCurrentTagInfo(first.name)
    }
    global.state_event.on('navActiveIdUpdated', handleNavUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleNavUpdate)
    }
  }, [])

  const currentCategory = categories[activeCategoryIndex]

  return (
    <View style={styles.container}>
      <View style={styles.categoryRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
          {categories.map((cat, index) => (
            <Button
              key={index}
              style={styles.categoryBtn}
              onPress={() => handleCategoryChange(index)}
            >
              <Text
                size={15}
                color={activeCategoryIndex === index ? theme['c-primary-font'] : theme['c-font']}
                style={{ fontWeight: activeCategoryIndex === index ? '600' : '400' }}
              >
                {cat.name || t('songlist_tag_default')}
              </Text>
            </Button>
          ))}
        </ScrollView>
      </View>
      {currentCategory && (
        <View style={styles.tagRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
            {currentCategory.list.map(item => (
              activeTagId === item.id ? (
                <View style={{ ...styles.tagBtn, borderBottomColor: theme['c-primary-font'] }} key={item.id}>
                  <Text size={13} color={theme['c-primary-font']} style={{ fontWeight: '600' }}>{item.name}</Text>
                </View>
              ) : (
                <Button
                  style={styles.tagBtn}
                  key={item.id}
                  onPress={() => handleTagChange(item)}
                >
                  <Text size={13} color={theme['c-font']}>{item.name}</Text>
                </Button>
              )
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
})

const styles = createStyle({
  container: {
  },
  categoryRow: {
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
  },
  categoryBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginRight: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagRow: {
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
  },
  tagBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
})