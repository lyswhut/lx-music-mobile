package org.jaudiotagger.audio.dsf;

import java.util.HashMap;
import java.util.Map;

/**
 * Chunk types mark each {@link org.jaudiotagger.audio.iff.ChunkHeader}. They are <em>always</em> 4 ASCII chars long.
 *
 * @see org.jaudiotagger.audio.iff.Chunk
 */
public enum DsfChunkType
{
    DSD("DSD "),
    FORMAT("fmt "),
    DATA("data"),
    ID3("ID3"),
    ;

    private static final Map<String, DsfChunkType> CODE_TYPE_MAP = new HashMap<String, DsfChunkType>();
    private String code;

    /**
     * @param code 4 char string
     */
    DsfChunkType(final String code)
    {
        this.code=code;
    }

    /**
     * Get {@link DsfChunkType} for code (e.g. "SSND").
     *
     * @param code chunk id
     * @return chunk type or {@code null} if not registered
     */
    public synchronized static DsfChunkType get(final String code) {
        if (CODE_TYPE_MAP.isEmpty()) {
            for (final DsfChunkType type : values()) {
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
