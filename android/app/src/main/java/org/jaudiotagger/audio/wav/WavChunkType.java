package org.jaudiotagger.audio.wav;

import java.util.HashMap;
import java.util.Map;

/**
 * Chunk types mark each {@link org.jaudiotagger.audio.iff.ChunkHeader}. They are <em>always</em> 4 ASCII chars long.
 *
 * @see org.jaudiotagger.audio.iff.Chunk
 */
public enum WavChunkType
{
    FORMAT("fmt ", "Basic Audio Information"),
    FACT("fact", "Only strictly required for Non-PCM or compressed data"),
    DATA("data", "Stores the actual audio data"),
    LIST("LIST", "List chunk, wraps round other chunks"),
    INFO("INFO", "Original metadata implementation"),
    ID3("id3 ", "Stores metadata in ID3 chunk"),
    CORRUPT_LIST("iLIS", "List chunk, wraps round other chunks"),
    CORRUPT_ID3_LATE("d3 \u0000", "Stores metadata in ID3 chunk"),
    CORRUPT_ID3_EARLY("\u0000id3", "Stores metadata in ID3 chunk");
    ;

    private static final Map<String, WavChunkType> CODE_TYPE_MAP = new HashMap<String, WavChunkType>();
    private String code;
    private String description;

    /**
     * Get {@link WavChunkType} for code (e.g. "SSND").
     *
     * @param code chunk id
     * @return chunk type or {@code null} if not registered
     */
    public synchronized static WavChunkType get(final String code) {
        if (CODE_TYPE_MAP.isEmpty()) {
            for (final WavChunkType type : values()) {
                CODE_TYPE_MAP.put(type.getCode(), type);
            }
        }
        return CODE_TYPE_MAP.get(code);
    }

    /**
     * @param code 4 char string
     */
    WavChunkType(final String code, String description)
    {
        this.code=code;
        this.description=description;
    }

    /**
     * 4 char type code.
     *
     * @return 4 char type code, e.g. "SSND" for the sound chunk.
     */
    public String getCode()
    {
        return code;
    }
}
