package org.jaudiotagger.audio.aiff.chunk;

import java.util.HashMap;
import java.util.Map;

/**
 * Chunk types mark each {@link org.jaudiotagger.audio.iff.ChunkHeader}. They are <em>always</em> 4 ASCII chars long.
 *
 * @see org.jaudiotagger.audio.iff.Chunk
 */
public enum AiffChunkType
{
    FORMAT_VERSION("FVER"),
    APPLICATION("APPL"),
    SOUND("SSND"),
    COMMON("COMM"),
    COMMENTS("COMT"),
    NAME("NAME"),
    AUTHOR("AUTH"),
    COPYRIGHT("(c) "),
    ANNOTATION("ANNO"),
    TAG("ID3 "),
    CORRUPT_TAG_LATE("D3 \u0000"),
    CORRUPT_TAG_EARLY("\u0000ID3");

    private static final Map<String, AiffChunkType> CODE_TYPE_MAP = new HashMap<String, AiffChunkType>();
    private String code;

    /**
     * @param code 4 char string
     */
    AiffChunkType(final String code)
    {
        this.code=code;
    }

    /**
     * Get {@link AiffChunkType} for code (e.g. "SSND").
     *
     * @param code chunk id
     * @return chunk type or {@code null} if not registered
     */
    public synchronized static AiffChunkType get(final String code) {
        if (CODE_TYPE_MAP.isEmpty()) {
            for (final AiffChunkType type : values()) {
                CODE_TYPE_MAP.put(type.getCode(), type);
            }
        }
        return CODE_TYPE_MAP.get(code);
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
