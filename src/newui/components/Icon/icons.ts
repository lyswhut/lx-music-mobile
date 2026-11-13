/**
 * 本文件由 scripts/gen-newui-icons.mjs 从 new_design/index.html 的 SVG sprite 自动生成，请勿手改。
 * 共 38 个图标；重新生成：node scripts/gen-newui-icons.mjs
 */
import type { IconDef } from './types'

export type IconName = "search" | "play" | "pause" | "prev" | "next" | "more" | "chevron" | "close" | "home" | "list" | "chart" | "user" | "heart" | "wave" | "signal" | "battery" | "timer" | "timerOn" | "sun" | "repeat" | "repeat1" | "repeatOff" | "stopAfter" | "shuffle" | "moon" | "comment" | "float" | "floatOn" | "heartFill" | "heartSolid" | "plus" | "gear" | "clock" | "link" | "edit" | "phone" | "phoneSolid" | "trash"

export const ICON_DATA: Record<IconName, IconDef> = {
  "search": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 0m8.5 12L23 22.5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "play": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M7 4.5 20 12 7 19.5V4.5Z", fill: "currentColor" } },
    ],
  },
  "pause": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M7 4.5h4v15H7zM13 4.5h4v15h-4z", fill: "currentColor" } },
    ],
  },
  "prev": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M6 5v14M19 5 8 12l11 7V5Z", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
  "next": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M18 5v14M5 5l11 7L5 19V5Z", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
  "more": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "circle", props: { cx: 5, cy: 12, r: 1.9, fill: "currentColor" } },
      { type: "circle", props: { cx: 12, cy: 12, r: 1.9, fill: "currentColor" } },
      { type: "circle", props: { cx: 19, cy: 12, r: 1.9, fill: "currentColor" } },
    ],
  },
  "chevron": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M9 5l7 7-7 7", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
  "close": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M6 6l12 12M18 6 6 18", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" } },
    ],
  },
  "home": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" } },
    ],
  },
  "list": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4 6h11M4 12h11M4 18h7m5-3.5 4 3.5-4 3.5v-7Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
  "chart": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M5 20V9m7 11V4m7 16v-7", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "user": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "circle", props: { cx: 12, cy: 8, r: 3.6, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M4.5 20a7.5 7.5 0 0 1 15 0", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "heart": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" } },
    ],
  },
  "wave": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M3 12h2.5M8 7.5v9M12 5v14M16 8.5v7M20.5 11h.5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "signal": {
    viewBox: "0 0 20 12",
    nodes: [
      { type: "rect", props: { x: 0, y: 7, width: 3, height: 5, rx: 1 } },
      { type: "rect", props: { x: 5, y: 4.5, width: 3, height: 7.5, rx: 1 } },
      { type: "rect", props: { x: 10, y: 2, width: 3, height: 10, rx: 1 } },
      { type: "rect", props: { x: 15, y: 0, width: 3, height: 12, rx: 1, opacity: 0.35 } },
    ],
  },
  "battery": {
    viewBox: "0 0 26 12",
    nodes: [
      { type: "rect", props: { x: 1, y: 1, width: 20, height: 10, rx: 3, fill: "none", stroke: "currentColor", strokeWidth: 1.4, opacity: 0.5 } },
      { type: "rect", props: { x: 3, y: 3, width: 14, height: 6, rx: 1.8, fill: "currentColor" } },
      { type: "path", props: { d: "M23 4.5v3", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", opacity: 0.5 } },
    ],
  },
  "timer": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "circle", props: { cx: 12, cy: 13, r: 8, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M12 9.5V13l2.5 1.6M9.5 2.5h5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "timerOn": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "circle", props: { cx: 12, cy: 13, r: 8, fill: "currentColor", opacity: 0.25 } },
      { type: "circle", props: { cx: 12, cy: 13, r: 8, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M12 9.5V13l2.5 1.6M9.5 2.5h5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "sun": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "circle", props: { cx: 12, cy: 12, r: 4.4, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M18.6 5.4l-1.5 1.5M6.9 17.1l-1.5 1.5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "repeat": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4 9a5 5 0 0 1 5-5h9m0 0-3-3m3 3-3 3M20 15a5 5 0 0 1-5 5H6m0 0 3 3m-3-3 3-3", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
  "repeat1": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4 9a5 5 0 0 1 5-5h9m0 0-3-3m3 3-3 3M20 15a5 5 0 0 1-5 5H6m0 0 3 3m-3-3 3-3", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } },
      { type: "text", props: { x: 12, y: 15.4, fontSize: 8, fontWeight: 800, textAnchor: "middle", fill: "currentColor", stroke: "none" }, text: "1" },
    ],
  },
  "repeatOff": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4 9a5 5 0 0 1 5-5h9m0 0-3-3m3 3-3 3M20 15a5 5 0 0 1-5 5H6m0 0 3 3m-3-3 3-3", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.55 } },
      { type: "path", props: { d: "M5 3.6 19.4 20.4", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" } },
    ],
  },
  "stopAfter": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M5 5.5 15.5 12 5 18.5V5.5Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" } },
      { type: "path", props: { d: "M19.8 5v14", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" } },
    ],
  },
  "shuffle": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M3 6h3.5c1.5 0 2.4.8 3.4 2.4l3.2 5.2c1 1.6 1.9 2.4 3.4 2.4H21m0 0-3-3m3 3-3 3M3 18h3.5c1.5 0 2.4-.8 3.4-2.4M14.6 8.2C15.6 6.7 16.5 6 18 6h3m0 0-3-3m3 3-3 3", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
  "moon": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M20 14.2A8.6 8.6 0 0 1 9.8 4a8.6 8.6 0 1 0 10.2 10.2Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" } },
    ],
  },
  "comment": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.4A7.5 7.5 0 1 1 20 12Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" } },
      { type: "path", props: { d: "M9 11h6M9 14h3.5", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", opacity: 0.8 } },
    ],
  },
  "float": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "rect", props: { x: 2.5, y: 3.5, width: 12, height: 8.5, rx: 2.6, fill: "none", stroke: "currentColor", strokeWidth: 2, opacity: 0.5 } },
      { type: "rect", props: { x: 7.5, y: 10, width: 14, height: 10.5, rx: 5.2, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M11 15.3h7.5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "floatOn": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "rect", props: { x: 2.5, y: 3.5, width: 12, height: 8.5, rx: 2.6, fill: "none", stroke: "currentColor", strokeWidth: 2, opacity: 0.5 } },
      { type: "rect", props: { x: 7.5, y: 10, width: 14, height: 10.5, rx: 5.2, fill: "currentColor", fillOpacity: 0.25, stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M11 15.3h7.5", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "heartFill": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z", fill: "currentColor" } },
    ],
  },
  "heartSolid": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", fill: "currentColor" } },
    ],
  },
  "plus": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M12 5v14M5 12h14", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" } },
    ],
  },
  "gear": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "g", props: { fill: "none", stroke: "currentColor", strokeWidth: 2 }, children: [
        { type: "circle", props: { cx: 12, cy: 12, r: 6.9 } },
        { type: "circle", props: { cx: 12, cy: 12, r: 2.7 } },
      ] },
      { type: "path", props: { d: "M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.35 5.35l1.65 1.65M17 17l1.65 1.65M5.35 18.65 7 17M17 7l1.65-1.65", fill: "none", stroke: "currentColor", strokeWidth: 2.2 } },
    ],
  },
  "clock": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "circle", props: { cx: 12, cy: 12, r: 8.4, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M12 7.6V12l3.2 2", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "link": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M14.5 7.5h2.5a4.5 4.5 0 0 1 0 9h-2.5M9.5 7.5H7a4.5 4.5 0 0 0 0 9h2.5M8.5 12h7", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "edit": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4.5 19.5h3.2l9.6-9.6-3.2-3.2L4.5 16.3v3.2Z", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinejoin: "round" } },
      { type: "path", props: { d: "M13.6 6.2 17.4 10M15.8 4.2 19.8 8.2", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "phone": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "rect", props: { x: 6.5, y: 2.5, width: 11, height: 19, rx: 3, fill: "none", stroke: "currentColor", strokeWidth: 2 } },
      { type: "path", props: { d: "M10.4 18.6h3.2", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" } },
    ],
  },
  "phoneSolid": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z", fill: "currentColor" } },
    ],
  },
  "trash": {
    viewBox: "0 0 24 24",
    nodes: [
      { type: "path", props: { d: "M4.5 7h15M9.5 7V4.6h5V7M6.6 7l.9 12.4a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5L17.4 7M10.4 11v6M13.6 11v6", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } },
    ],
  },
}
