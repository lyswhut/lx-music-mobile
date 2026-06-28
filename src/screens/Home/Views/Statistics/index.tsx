import { useEffect, useState } from 'react'
import { View, ScrollView } from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { createStyle } from '@/utils/tools'
import { dateFormat } from '@/utils/common'
import { useI18n } from '@/lang/index'
import Text from '@/components/common/Text'
import { getStatistics, type StatisticsData } from '@/core/init/player/playStatistics'

type Translate = ReturnType<typeof useI18n>
type TranslateValues = Record<string, string | number | boolean>

const DAY = 86400000

const formatDuration = (seconds: number, t: Translate) => {
  if (seconds < 60) return t('statistics__duration_seconds', { seconds })
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins < 60) return t('statistics__duration_minutes', { minutes: mins, seconds: secs })
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return t('statistics__duration_hours', { hours, minutes: remainingMins })
}

// 本周（周一为起点）听歌时长
const sumWeek = (daily: Record<string, number>) => {
  const now = new Date()
  const offset = (now.getDay() + 6) % 7 // 0 = 周一
  let sum = 0
  for (let i = offset; i >= 0; i--) sum += daily[dateFormat(now.getTime() - i * DAY, 'Y-M-D')] || 0
  return sum
}

// 本月（自然月）听歌时长
const sumMonth = (daily: Record<string, number>) => {
  const prefix = dateFormat(Date.now(), 'Y-M')
  let sum = 0
  for (const key in daily) if (key.startsWith(prefix)) sum += daily[key]
  return sum
}

// 连续听歌天数（今天还没听则从昨天起算）
const computeStreak = (daily: Record<string, number>) => {
  let streak = 0
  let cursor = Date.now()
  if (!daily[dateFormat(cursor, 'Y-M-D')]) cursor -= DAY
  while (daily[dateFormat(cursor, 'Y-M-D')] > 0) {
    streak++
    cursor -= DAY
  }
  return streak
}

// 乐龄文案
const formatAge = (firstUseDate: string, t: Translate) => {
  if (!firstUseDate) return t('statistics__days', { days: 0 })
  const [y, m, d] = firstUseDate.split('-').map(Number)
  const now = new Date()
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m)
  if (now.getDate() < d) months -= 1
  if (months < 1) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / DAY))
    return t('statistics__days', { days })
  }
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return years > 0
    ? t('statistics__age_ym', { years, months: remMonths })
    : t('statistics__age_months', { months: remMonths })
}

// 近 14 天听歌强度（0=无，1~3 由浅至深）
const recentHeat = (daily: Record<string, number>) => {
  const vals: number[] = []
  const now = Date.now()
  for (let i = 13; i >= 0; i--) vals.push(daily[dateFormat(now - i * DAY, 'Y-M-D')] || 0)
  const max = Math.max(...vals, 1)
  return vals.map(v => {
    if (v <= 0) return 0
    const r = v / max
    if (r <= 1 / 3) return 1
    if (r <= 2 / 3) return 2
    return 3
  })
}

// 各音源占比（降序）
const computeSources = (sourceStats: Record<string, number>) => {
  const entries = Object.entries(sourceStats).filter(([, v]) => v > 0)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (!total) return []
  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([source, v]) => ({ source, percent: Math.round((v / total) * 100) }))
}

export default () => {
  const theme = useTheme()
  const t = useI18n()
  const [stats, setStats] = useState<StatisticsData>(getStatistics())

  useEffect(() => {
    const handleUpdate = (newStats: StatisticsData) => {
      setStats({ ...newStats })
    }
    // 获取当前最新统计
    setStats({ ...getStatistics() })

    global.state_event.on('statisticsUpdated', handleUpdate)
    return () => {
      global.state_event.off('statisticsUpdated', handleUpdate)
    }
  }, [])

  // source_alias_* 为动态键，单独放宽类型
  const tSource = t as (key: string, val?: TranslateValues) => string

  const daily = stats.dailyStats || {}
  const todayDuration = daily[dateFormat(Date.now(), 'Y-M-D')] || 0
  const weekDuration = sumWeek(daily)
  const monthDuration = sumMonth(daily)
  const totalDuration = stats.totalDuration || 0
  const streak = computeStreak(daily)
  const heat = recentHeat(daily)
  const sources = computeSources(stats.sourceStats || {})

  const cardBg = theme['c-primary-light-900-alpha-200'] || 'rgba(0,0,0,0.05)'
  // 注意 token 命名与不透明度相反：alpha-900 最透明(0.10)、alpha-100 最实(0.90)
  const heatColors = [
    cardBg, // 0 无记录
    theme['c-primary-alpha-600'], // 1 浅 0.40
    theme['c-primary-alpha-300'], // 2 中 0.70
    theme['c-primary-alpha-100'], // 3 深 0.90
  ]

  const metrics = [
    { label: t('statistics__today'), value: formatDuration(todayDuration, t) },
    { label: t('statistics__week'), value: formatDuration(weekDuration, t) },
    { label: t('statistics__month'), value: formatDuration(monthDuration, t) },
    { label: t('statistics__total'), value: formatDuration(totalDuration, t) },
  ]

  return (
    <ScrollView style={{ ...styles.container, backgroundColor: theme['c-content-background'] }}>
      <View style={styles.content}>
        <View style={styles.grid}>
          {metrics.map((m, i) => (
            <View key={i} style={{ ...styles.metricCard, backgroundColor: cardBg }}>
              <Text style={styles.metricLabel} size={13} color={theme['c-font-label']}>{m.label}</Text>
              <Text style={styles.metricValue} size={20} color={theme['c-primary-font']}>{m.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ ...styles.metricCard, backgroundColor: cardBg }}>
            <Text style={styles.metricLabel} size={13} color={theme['c-font-label']}>{t('statistics__streak')}</Text>
            <Text style={styles.metricValue} size={20} color={theme['c-primary-font']}>{t('statistics__days', { days: streak })}</Text>
          </View>
          <View style={{ ...styles.metricCard, backgroundColor: cardBg }}>
            <Text style={styles.metricLabel} size={13} color={theme['c-font-label']}>{t('statistics__age')}</Text>
            <Text style={styles.metricValue} size={20} color={theme['c-primary-font']}>{formatAge(stats.firstUseDate, t)}</Text>
          </View>
        </View>

        {sources.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} size={14} color={theme['c-font-label']}>{t('statistics__source_title')}</Text>
            {sources.map(s => (
              <View key={s.source} style={styles.sourceRow}>
                <Text size={13} color={theme['c-font']} style={styles.sourceName}>{tSource('source_alias_' + s.source) || s.source}</Text>
                <View style={{ ...styles.sourceTrack, backgroundColor: cardBg }}>
                  <View style={{ ...styles.sourceFill, width: `${s.percent}%`, backgroundColor: theme['c-primary'] }} />
                </View>
                <Text size={12} color={theme['c-font-label']} style={styles.sourcePercent}>{s.percent}%</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle} size={14} color={theme['c-font-label']}>{t('statistics__heatmap_title')}</Text>
          <View style={styles.heatRow}>
            {heat.map((level, i) => (
              <View key={i} style={{ ...styles.heatCell, backgroundColor: heatColors[level] }} />
            ))}
          </View>
        </View>

        <View style={styles.tipContainer}>
          <Text style={styles.tipText} size={12} color={theme['c-font-label']}>
            {t('statistics__tip')}
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = createStyle({
  container: {
    flex: 1,
  },
  content: {
    padding: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: 8,
    padding: 16,
    elevation: 1,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricLabel: {
    marginBottom: 6,
  },
  metricValue: {
    fontWeight: 'bold',
  },
  section: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sourceName: {
    width: 56,
  },
  sourceTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  sourceFill: {
    height: '100%',
    borderRadius: 4,
  },
  sourcePercent: {
    width: 40,
    textAlign: 'right',
  },
  heatRow: {
    flexDirection: 'row',
    gap: 4,
  },
  heatCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },
  tipContainer: {
    marginTop: 10,
    paddingHorizontal: 5,
  },
  tipText: {
    lineHeight: 18,
  },
})
