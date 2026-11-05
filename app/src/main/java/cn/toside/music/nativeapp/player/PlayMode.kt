package cn.toside.music.nativeapp.player

enum class PlayMode(val label: String) {
    LIST_LOOP("列表循环"), ORDER("顺序播放"), SINGLE("单曲循环"), SHUFFLE("随机播放");
    fun next(): PlayMode = entries[(ordinal + 1) % entries.size]
}

/** Returns null when an ordered queue reaches its end. */
fun nextSongIndex(mode: PlayMode, index: Int, size: Int, completed: Boolean, random: (Int) -> Int): Int? {
    if (size <= 0 || index !in 0 until size) return null
    if (completed && mode == PlayMode.SINGLE) return index
    if (mode == PlayMode.SHUFFLE && size > 1) {
        val candidate = random(size - 1).coerceIn(0, size - 2)
        return if (candidate >= index) candidate + 1 else candidate
    }
    if (completed && mode == PlayMode.ORDER && index == size - 1) return null
    return (index + 1) % size
}
