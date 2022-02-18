import React, { memo, useState, useMemo, useCallback } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { useGetter, useDispatch } from '@/store'
import { BorderWidths } from '@/theme'
import defaultUser from '@/resources/images/defaultUser.jpg'
import { Icon } from '@/components/common/Icon'

const GAP = 12

const CommentFloor = memo(({ comment, isLast }) => {
  const theme = useGetter('common', 'theme')
  const [isAvatarError, setIsAvatarError] = useState(false)

  const handleAvatarError = useCallback(() => {
    setIsAvatarError(true)
  }, [])

  const replyComments = useMemo(() => {
    if (!comment.reply || !comment.reply.length) return null
    const endIndex = comment.reply.length - 1
    return (
      <View style={{ ...styles.replyFloor, borderTopColor: theme.borderColor }}>
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
        <Icon name="thumbs-up" style={{ color: theme.normal50 }} size={12} />
        <Text style={{ ...styles.likedCount, color: theme.normal50 }}>{comment.likedCount}</Text>
      </View>
    )
  }, [])

  return (
    <View style={{ ...styles.container, borderBottomColor: theme.borderColor, borderBottomWidth: isLast ? 0 : BorderWidths.normal, paddingBottom: isLast ? 0 : GAP }}>
      <View style={styles.comment}>
        <View style={styles.left}>
          <Image source={comment.avatar && !isAvatarError ? { uri: comment.avatar } : defaultUser} onError={handleAvatarError} progressiveRenderingEnabled={true} borderRadius={4} style={styles.avatar} />
        </View>
        <View style={styles.right}>
          <View style={styles.info}>
            <View>
              <Text selectable numberOfLines={1} style={{ ...styles.userName, color: theme.normal }}>{comment.userName}</Text>
              <Text numberOfLines={1} style={{ ...styles.time, color: theme.normal30 }}>{comment.timeStr}</Text>
            </View>
            {likedCount}
          </View>
          <Text selectable style={{ ...styles.text, color: theme.normal }}>{comment.text}</Text>
        </View>
      </View>
      {replyComments}
    </View>
  )
})

const styles = StyleSheet.create({
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
  avatar: {
    width: 36,
    height: 36,
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
  userName: {
    fontSize: 14,
    // lineHeight: 16,
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  like: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likedCount: {
    marginLeft: 2,
    fontSize: 12,
  },
  text: {
    // textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    // paddingTop: 5,
    // paddingBottom: 5,
    // opacity: 0,
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
