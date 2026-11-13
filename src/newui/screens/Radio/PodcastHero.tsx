import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Art } from '@/newui/components/Art'
import { QTag } from '@/newui/components/QTag'
import {
  FONT_SIZE,
  FONT_WEIGHT,
  PL_LAYER,
  RADIUS,
  SHADOW,
  useTheme,
} from '@/newui/theme'

/**
 * 播客详情的头部（原型 `.pl-hero` 的**播客形态**：`new_design/parts/radio/detail.html` L13，
 * 内容由 `openPodcast()` 生成（app.js L2001-L2019），样式本体是跨件原子 `.pl-hero`（源 styles.css L569-L575，
 * 登记在歌单详情 U68，尺寸全部走现成 token `PL_LAYER.hero*`）。
 *
 * **为什么不复用 `SonglistDetail/PlaylistHero`**（工单点名要理由）：
 * 1. `PlaylistHeroProps` 的元信息行是**单枚** `metaTag: string` + 一串 `metaParts: string[]`，
 *    并以 1×9 竖线分隔（PlaylistHero.tsx:20-23 与 :78-90）；播客 hero 要的是**两枚** `q-tag`
 *    并排、后面直接跟文字（app.js L2008-L2012 的 `tags.slice(0, 2)`，span 之间没有 `.sep`）。
 * 2. `PlaylistHero` 还带一条榜单专属分支 `chartKind`（:28-33、:60-76：头图换成 `ChartArt`），
 *    播客没有榜型概念，那颗分支对本屏是死代码。
 * 3. `PlaylistHero` 的 `sub` 位是**简介**（原型 ph-sub：`desc || author`）；播客**没有简介位**
 *    （detail.html 件头逐字「没有简介位，接口不给」——lookup 的节目本体不给 description），
 *    本屏的 `ph-sub` 那一位放的是**作者**。
 * 改 `PlaylistHero` 会牵动 SonglistDetail 的既有调用面，故按对撞 7.1 新建屏级辅件。
 *
 * 纯展示组件：`tags` 的切片、四段文案的拼接、种子的取色都由容器算好后传入。
 */
export interface PodcastHeroProps {
  /** 封面种子（`pod:<节目 id>`，与 `.pl-bg` 底纹同源） */
  artSeed: string
  /** 封面图（③ 给 600 档；无图回落种子程序化底） */
  artUri?: string
  /** 节目名（`.pl-hero h3`） */
  name: string
  /** 作者（`.ph-sub`，← `artistName`） */
  by: string
  /** 分类词（容器已按原型 `slice(0, 2)` 截好；空数组就不挂胶囊） */
  tags: readonly string[]
  /** 「共 N 集」：只有 ②/③ 给得出，给不出就不传（app.js L2014） */
  countText?: string
  /** 「最新单集 M 月 D 日」：同上（app.js L2015） */
  latestText?: string
  /** 「还剩 X」：本机真听过这个节目才有（app.js L2016-L2018） */
  leftText?: string
}

export const PodcastHero = memo(({
  artSeed,
  artUri,
  name,
  by,
  tags,
  countText,
  latestText,
  leftText,
}: PodcastHeroProps) => {
  const theme = useTheme()
  // `.ph-meta` 的文字段：接口/本机给不出来的那几段干脆不出现（不留空槽，也不写「未听」这种话）
  const metaTexts = [countText, latestText, leftText].filter(
    (text): text is string => text != null && text.length > 0,
  )
  return (
    <View style={styles.root}>
      <Art
        width={PL_LAYER.heroArtSize}
        height={PL_LAYER.heroArtSize}
        radius={RADIUS.art}
        seed={artSeed}
        imageUri={artUri}
        style={styles.art}
      />
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
          {name}
        </Text>
        {by.length > 0 && (
          <Text style={[styles.by, { color: theme.colors.text2 }]} numberOfLines={2}>
            {by}
          </Text>
        )}
        {(tags.length > 0 || metaTexts.length > 0) && (
          <View style={styles.meta}>
            {tags.map(tag => (
              <QTag key={tag} label={tag} />
            ))}
            {/* 文字段与胶囊同一条 gap:6 排，span 之间不插 `.sep`（app.js L2013-L2018 就是裸 span） */}
            {metaTexts.map(text => (
              <Text key={text} style={[styles.metaText, { color: theme.colors.text3 }]}>
                {text}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )
})

PodcastHero.displayName = 'NewUIPodcastHero'

const styles = StyleSheet.create({
  /** .pl-hero{display:flex;gap:14px;margin:22px 0 2px;min-height:124px} */
  root: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: PL_LAYER.heroGap,
    marginTop: PL_LAYER.heroMarginTop,
    marginBottom: PL_LAYER.heroMarginBottom,
    minHeight: PL_LAYER.heroMinHeight,
  },
  /** .pl-hero .art{124×124;flex:none;border-radius:20px}；CSS 负 spread 投影取 SHADOW.card 近似 */
  art: {
    ...SHADOW.card,
  },
  /** .ph-body{flex:1;min-width:0;justify-content:flex-end;gap:6px} */
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'flex-end',
    gap: PL_LAYER.heroBodyGap,
  },
  /** h3{18px/900;line-height:1.35} */
  name: {
    fontSize: FONT_SIZE.heading,
    fontWeight: FONT_WEIGHT.black,
    lineHeight: Math.round(FONT_SIZE.heading * PL_LAYER.heroTitleLineHeightRatio),
  },
  /** .ph-sub{11.5px;color:text-2;line-height:1.5} */
  by: {
    fontSize: FONT_SIZE.captionLg,
    lineHeight: Math.round(FONT_SIZE.captionLg * PL_LAYER.heroSubLineHeightRatio),
  },
  /** .ph-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;10.5px;text-3} */
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: PL_LAYER.metaGap,
  },
  metaText: {
    fontSize: FONT_SIZE.tiny,
  },
})
