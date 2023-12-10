package org.jaudiotagger.audio.aiff;

/**
 * AIFF types, refers to BigEndian or LittleEndian
 */
public enum AiffType
{
    AIFF("AIFF"), //Original non-compressed format on Mac pre-intel hardware
    AIFC("AIFC"), //Originally Compressed AIFF but also used for Uncompressed in LE rather than BE order
    ;

    String code;

    AiffType(String code)
    {
        this.code=code;
    }

    public String getCode()
    {
        return code;
    }
}
