package cn.toside.music.nativeapp.data

import cn.toside.music.nativeapp.player.PlayMode

import java.util.Locale

/** The original rule format: title, @artist, or title@artist, one rule per line. */
internal class DislikeRules private constructor(val text: String, private val rules: Set<String>) {
    fun matches(song: Song): Boolean {
        val name = normalize(song.title); val artist = normalize(song.artist)
        return name in rules || "@$artist" in rules || "$name@$artist" in rules
    }
    companion object {
        fun parse(raw: String): DislikeRules {
            val result = linkedSetOf<String>()
            raw.split('\n').forEach { line ->
                if (line.isEmpty()) return@forEach
                val parts = line.split('@')
                val name = normalize(parts.getOrElse(0) { "" })
                val artist = normalize(parts.getOrElse(1) { "" })
                when {
                    name.isNotEmpty() && artist.isNotEmpty() -> result.add("$name@$artist")
                    name.isNotEmpty() -> result.add(name)
                    artist.isNotEmpty() -> result.add("@$artist")
                }
            }
            return DislikeRules(result.joinToString("\n"), result)
        }
        private fun normalize(value: String): String = value.replace('@', '#').lowercase(Locale.ROOT).trim()
    }
}

/** Manual selection remains possible; automatic navigation skips blocked entries. */
internal fun nextAllowedSongIndex(
    mode: PlayMode, index: Int, songs: List<Song>, completed: Boolean,
    blocked: (Song) -> Boolean, random: (Int) -> Int,
): Int? {
    if (index !in songs.indices) return null
    val eligible = songs.indices.filterNot { blocked(songs[it]) }
    if (eligible.isEmpty()) return null
    if (completed && mode == PlayMode.SINGLE && index in eligible) return index
    if (mode == PlayMode.SHUFFLE) {
        val choices = eligible.filter { it != index }.ifEmpty { eligible }
        return choices[random(choices.size).coerceIn(0, choices.lastIndex)]
    }
    val after = eligible.firstOrNull { it > index }
    if (after != null) return after
    if (completed && mode == PlayMode.ORDER) return null
    return eligible.first()
}

internal fun previousAllowedSongIndex(index: Int, songs: List<Song>, blocked: (Song) -> Boolean): Int? {
    if (index !in songs.indices) return null
    val eligible = songs.indices.filterNot { blocked(songs[it]) }
    return eligible.lastOrNull { it < index } ?: eligible.lastOrNull()
}
