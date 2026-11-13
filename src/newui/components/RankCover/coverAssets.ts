/* eslint-disable */
/**
 * 本文件由 scripts/gen-newui-rank-covers.mjs 从 new_design/rank-covers/*.png 生成，请勿手改。
 * ./covers/<key>.webp 是母图（无损 PNG，只留在原型那侧）按 q85 压出来的出包件；母图 49 张合计 17.03 MB，
 * 原样进包会把 APK 从 13.9 MB 顶到 32 MB，所以打进去的是 WebP。改画质请改生成脚本 WEBP_QUALITY 再重跑。
 * 卡上那两行白字直接压图，只靠紧贴字边的小投影兜可读性（ChartArt），**不叠压顶遮罩**——
 * 2026-10-22 那档遮罩按用户口径撤了；要再挂得先重跑 scripts/rank-scrim-solver.html 对出包这批重证。
 * 由 Metro 打进 APK（装了就能看，不连 dev server）。require 的路径必须写成字面量，动态拼路径 Metro 收不到。
 */

/** 封面 key → 静态资源（key = new_design/rank-covers/ 的文件名；判据见 const/rankCoverWords.ts，命不中时外层铺 default 那张） */
export const RANK_COVER_ASSETS: Readonly<Record<string, number>> = {
  "acg": require('./covers/acg.webp'),
  "ancient_style": require('./covers/ancient_style.webp'),
  "billboard": require('./covers/billboard.webp'),
  "bus": require('./covers/bus.webp'),
  "cantonese": require('./covers/cantonese.webp'),
  "children": require('./covers/children.webp'),
  "chinese": require('./covers/chinese.webp'),
  "chinese_style": require('./covers/chinese_style.webp'),
  "classic": require('./covers/classic.webp'),
  "country": require('./covers/country.webp'),
  "country_china": require('./covers/country_china.webp'),
  "default": require('./covers/default.webp'),
  "electronic": require('./covers/electronic.webp'),
  "female": require('./covers/female.webp'),
  "folk": require('./covers/folk.webp'),
  "france": require('./covers/france.webp'),
  "healing": require('./covers/healing.webp'),
  "hongkong": require('./covers/hongkong.webp'),
  "hot": require('./covers/hot.webp'),
  "identify_song": require('./covers/identify_song.webp'),
  "instrumental": require('./covers/instrumental.webp'),
  "itunes": require('./covers/itunes.webp'),
  "japan": require('./covers/japan.webp'),
  "japanese_language": require('./covers/japanese_language.webp'),
  "jazz": require('./covers/jazz.webp'),
  "karaoke": require('./covers/karaoke.webp'),
  "kkbox": require('./covers/kkbox.webp'),
  "korea": require('./covers/korea.webp'),
  "ktv": require('./covers/ktv.webp'),
  "live": require('./covers/live.webp'),
  "male": require('./covers/male.webp'),
  "melon": require('./covers/melon.webp'),
  "new": require('./covers/new.webp'),
  "oricon": require('./covers/oricon.webp'),
  "original": require('./covers/original.webp'),
  "rap": require('./covers/rap.webp'),
  "ringtone": require('./covers/ringtone.webp'),
  "rising": require('./covers/rising.webp'),
  "rnb": require('./covers/rnb.webp'),
  "rock": require('./covers/rock.webp'),
  "soundtrack": require('./covers/soundtrack.webp'),
  "taiwan": require('./covers/taiwan.webp'),
  "thai": require('./covers/thai.webp'),
  "uk": require('./covers/uk.webp'),
  "vip": require('./covers/vip.webp'),
  "vlog": require('./covers/vlog.webp'),
  "west": require('./covers/west.webp'),
  "winter": require('./covers/winter.webp'),
  "youtube": require('./covers/youtube.webp'),
}
