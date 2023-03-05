import React, { memo, useState, useMemo, useCallback } from 'react'
import { View, Image } from 'react-native'
import { BorderWidths } from '@/theme'
import { Icon } from '@/components/common/Icon'
import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { type Comment } from '../utils'
import Text from '@/components/common/Text'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import ScaledImage from '@/components/common/ScaledImage'
import { useLayout } from '@/utils/hooks'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultUser = require('@/resources/images/defaultUser.jpg')

const GAP = 12
const avatarWidth = scaleSizeW(36)
const MAX_IMAGE_HEIGHT = scaleSizeH(260)

const CommentFloor = memo(({ comment, isLast }: {
  comment: Comment
  isLast?: boolean
}) => {
  const theme = useTheme()
  const [isAvatarError, setIsAvatarError] = useState(false)
  const { onLayout, width } = useLayout()

  const handleAvatarError = useCallback(() => {
    setIsAvatarError(true)
  }, [])

  const replyComments = useMemo(() => {
    if (!comment.reply?.length) return null
    const endIndex = comment.reply.length - 1
    return (
      <View style={{ ...styles.replyFloor, borderTopColor: theme['c-list-header-border-bottom'] }}>
        {
          comment.reply.map((c, index) => (
            <CommentFloor comment={c} isLast={index === endIndex} key={`${comment.id}_${c.id}`} />
          ))
        }
      </View>
    )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const likedCount = useMemo(() => {
    if (comment.likedCount == null) return null
    return (
      <View style={styles.like}>
        <Icon name="thumbs-up" style={{ color: theme['c-450'] }} size={12} />
        <Text style={styles.likedCount} size={12} color={ theme['c-450'] }>{comment.likedCount}</Text>
      </View>
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <View style={{ ...styles.container, borderBottomColor: theme['c-list-header-border-bottom'], borderBottomWidth: isLast ? 0 : BorderWidths.normal, paddingBottom: isLast ? 0 : GAP }}>
      <View style={styles.comment}>
        <View>
          <Image
            source={comment.avatar && !isAvatarError ? { uri: comment.avatar } : defaultUser}
            onError={handleAvatarError}
            progressiveRenderingEnabled={true}
            borderRadius={4}
            style={{ height: avatarWidth, width: avatarWidth }} />
        </View>
        <View style={styles.right}>
          <View style={styles.info}>
            <View>
              <Text selectable numberOfLines={1} size={14}>
                {comment.userName}
              </Text>
              <View style={styles.metaInfo}>
                <Text numberOfLines={1} size={12} color={theme['c-450']}>{comment.timeStr}</Text>
                { comment.location ? <Text numberOfLines={1} style={styles.location} size={12} color={theme['c-450']}>{comment.location}</Text> : null }
              </View>
            </View>
            {likedCount}
          </View>
          <Text selectable style={styles.text}>{comment.text}</Text>
          {
            comment.images?.length
              ? (
                  <View style={styles.images} onLayout={onLayout}>
                    {
                      comment.images.map((url, index) => <ScaledImage key={String(index)} uri={url} maxWidth={width} maxHeight={MAX_IMAGE_HEIGHT} />)
                    }
                  </View>
                )
              : null
          }
        </View>
      </View>
      {replyComments}
    </View>
  )
})

const styles = createStyle({
  container: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: GAP,
    paddingBottom: GAP,
    borderBottomWidth: BorderWidths.normal,
    borderStyle: 'dashed',
  },
  comment: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
  },
  right: {
    flex: 1,
    paddingLeft: 10,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaInfo: {
    marginTop: 2,
    flexDirection: 'row',
  },
  location: {
    marginLeft: 10,
  },
  like: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedCount: {
    marginLeft: 2,
  },
  text: {
    // textAlign: 'center',
    marginTop: 5,
    lineHeight: 19,
    // paddingTop: 5,
    // paddingBottom: 5,
    // opacity: 0,
  },
  images: {
    paddingTop: 5,
    width: '100%',
    flexDirection: 'row',
  },
  replyFloor: {
    marginTop: GAP,
    marginLeft: 20,
    borderTopWidth: BorderWidths.normal,
    // backgroundColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
})

export default CommentFloor
