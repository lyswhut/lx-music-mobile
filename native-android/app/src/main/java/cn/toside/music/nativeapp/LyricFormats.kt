package cn.toside.music.nativeapp

import org.json.JSONObject

/** Parsing and alignment contain no UI/runtime dependencies so every timestamp conversion can be tested. */
internal object LyricFormats {
    private val relative = Regex("<(-?\\d+),(-?\\d+)(?:,-?\\d+)?>")
    private val absolute = Regex("\\((\\d+),(\\d+)(?:,\\d+)?\\)")
    private val sentence = Regex("^\\[(\\d+),\\d+](.*)$")
    fun relativeWords(time: Long, text: String): LyricLine = prefixWords(time, text, relative, true)
    private fun prefixWords(time: Long, text: String, tags: Regex, relativeTime: Boolean): LyricLine {
        val matches = tags.findAll(text).toList()
        if (matches.isEmpty()) return LyricLine(time, text.trim())
        val plain = StringBuilder(text.substring(0, matches.first().range.first))
        val words = matches.mapIndexed { index, tag ->
            val start = plain.length
            plain.append(text.substring(tag.range.last + 1, matches.getOrNull(index + 1)?.range?.first ?: text.length))
            LyricWord((if (relativeTime) time else 0) + (tag.groupValues[1].toLongOrNull() ?: 0).coerceAtLeast(0),
                (tag.groupValues[2].toLongOrNull() ?: 0).coerceAtLeast(0), start, plain.length)
        }
        return trimmed(time, plain.toString(), words)
    }
    private fun trimmed(time: Long, value: String, words: List<LyricWord>): LyricLine {
        val trim = value.length - value.trimStart().length
        val text = value.trim()
        return LyricLine(time, text, words.map {
            it.copy(start = (it.start - trim).coerceIn(0, text.length), end = (it.end - trim).coerceIn(0, text.length))
        }.filter { it.end > it.start })
    }
    fun timedSentences(text: String, beforeWords: Boolean): List<LyricLine> {
        val offset = Regex("\\[offset:([+-]?\\d+)]", RegexOption.IGNORE_CASE).find(text)?.groupValues?.get(1)?.toLongOrNull() ?: 0
        return text.lineSequence().flatMap { raw ->
            val match = sentence.matchEntire(raw.trim())
            if (match == null) return@flatMap LrcParser.parse(raw).asSequence()
            val time = match.groupValues[1].toLong() + offset
            val content = match.groupValues[2]
            if (beforeWords) {
                val line = prefixWords(time, content, absolute, false)
                sequenceOf(line.copy(timeMs = time.coerceAtLeast(0), words = line.words.map { it.copy(startMs = (it.startMs + offset).coerceAtLeast(0)) }))
            } else {
                val plain = StringBuilder(); var cursor = 0
                val words = absolute.findAll(content).map { tag ->
                    val start = plain.length; plain.append(content.substring(cursor, tag.range.first)); cursor = tag.range.last + 1
                    LyricWord((tag.groupValues[1].toLong() + offset).coerceAtLeast(0), tag.groupValues[2].toLong(), start, plain.length)
                }.toList()
                plain.append(content.substring(cursor))
                sequenceOf(trimmed(time.coerceAtLeast(0), plain.toString(), words))
            }
        }.sortedBy { it.timeMs }.toList()
    }
    fun merge(main: List<LyricLine>, translations: List<LyricLine>, romanizations: List<LyricLine>, toleranceMs: Long = 100): List<LyricLine> {
        fun align(extra: List<LyricLine>): Map<Int, String> {
            val result = linkedMapOf<Int, MutableList<String>>()
            extra.filter { it.text.isNotBlank() }.forEach { line ->
                val candidate = LrcParser.indexAt(main, line.timeMs)
                val index = listOf(candidate, candidate + 1).filter { it in main.indices }
                    .minByOrNull { kotlin.math.abs(main[it].timeMs - line.timeMs) } ?: return@forEach
                if (kotlin.math.abs(main[index].timeMs - line.timeMs) <= toleranceMs) result.getOrPut(index) { mutableListOf() }.add(line.text)
            }
            return result.mapValues { it.value.distinct().joinToString("\n") }
        }
        val t = align(translations); val r = align(romanizations)
        return main.mapIndexed { index, line -> line.copy(translation = t[index] ?: line.translation, romanization = r[index] ?: line.romanization) }
    }
    fun netease(result: JSONObject): List<LyricLine> {
        fun text(key: String) = result.optJSONObject(key)?.optString("lyric").orEmpty()
        fun parse(value: String): List<LyricLine> = value.lineSequence().flatMap { line ->
            if (line.trimStart().startsWith("{\"")) {
                val header = runCatching { JSONObject(line) }.getOrNull()
                val chunks = header?.optJSONArray("c")
                if (header != null && chunks != null) sequenceOf(LyricLine(header.optLong("t").coerceAtLeast(0),
                    (0 until chunks.length()).joinToString("") { chunks.optJSONObject(it)?.optString("tx").orEmpty() })) else emptySequence()
            } else LrcParser.parse(line).asSequence()
        }.sortedBy { it.timeMs }.toList()
        val wordTimed = timedSentences(text("yrc"), true)
        val main = wordTimed.ifEmpty { parse(text("lrc")) }
        return merge(main, parse(text("ytlrc").ifBlank { text("tlyric") }), parse(text("yromalrc").ifBlank { text("romalrc") }))
    }
    fun highlightedCharacters(line: LyricLine, positionMs: Long): Int {
        if (positionMs < line.timeMs) return 0
        if (line.words.isEmpty()) return line.text.length
        var end = 0
        for (word in line.words) {
            if (positionMs < word.startMs) continue
            val progress = if (word.durationMs <= 0) 1.0 else ((positionMs - word.startMs).toDouble() / word.durationMs).coerceIn(0.0, 1.0)
            end = maxOf(end, word.start + ((word.end - word.start) * progress).toInt())
        }
        // Never cut a UTF-16 surrogate pair while highlighting emoji.
        return if (end in 1 until line.text.length && line.text[end - 1].isHighSurrogate() && line.text[end].isLowSurrogate()) end - 1 else end
    }
}
