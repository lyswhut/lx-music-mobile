#!/usr/bin/env python3
"""把封面母图（new_design/rank-covers/*.png）压成出包用的 WebP。

由 scripts/gen-newui-rank-covers.mjs 调起，不单独用。任务从 stdin 逐行读：
    <in.png>\t<out.webp>\t<quality>
母图是无损源文件，只留在原型那侧；进 APK 的一律是这里压出来的 WebP。

编码口径（改动会直接影响观感，别随手调）：
- convert('RGB')：这批封面全不透明，留 alpha 通道白胖
- method=6：最慢那档，同画质下最小
"""
import sys
from PIL import Image

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    src, dst, quality = line.split("\t")
    with Image.open(src) as im:
        if im.mode != "RGB":
            im = im.convert("RGB")
        im.save(dst, "WEBP", quality=int(quality), method=6)
