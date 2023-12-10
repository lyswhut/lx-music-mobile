package org.jaudiotagger.audio.wav.chunk;

import org.jaudiotagger.tag.FieldKey;

import java.util.HashMap;
import java.util.Map;

/**
 * Known Identifiers used in an INFO Chunk together with their mapping to a generic FieldKey (if known)
 */
public enum WavInfoIdentifier
{
    ARTIST("IART", FieldKey.ARTIST, 1),
    ALBUM("IPRD", FieldKey.ALBUM, 2),
    TITLE("INAM", FieldKey.TITLE, 3),
    TRACKNO("ITRK", FieldKey.TRACK, 4),
    YEAR("ICRD", FieldKey.YEAR, 5),
    GENRE("IGNR", FieldKey.GENRE, 6),
    //Custom MediaMonkey field, theres appears to be no official AlbumArtist field, nothing ever displayed for this field or IAAR in Windows Explorer
    ALBUM_ARTIST("iaar", FieldKey.ALBUM_ARTIST, 7),
    COMMENTS("ICMT", FieldKey.COMMENT, 8),
    COMPOSER("IMUS", FieldKey.COMPOSER, 9),
    CONDUCTOR("ITCH", FieldKey.CONDUCTOR, 10),
    LYRICIST("IWRI", FieldKey.LYRICIST, 11),
    ENCODER("ISFT", FieldKey.ENCODER, 12),
    RATING("IRTD", FieldKey.RATING, 13),
    ISRC("ISRC", FieldKey.ISRC, 14),
    LABEL("ICMS", FieldKey.RECORD_LABEL, 15),
    TRACK_GAIN("ITGL", null, 16), //Currently No mapping to a FieldKey for this
    ALBUM_GAIN("IAGL", null, 17), //Currently No mapping to a FieldKey for this
    COPYRIGHT("ICOP", null, 18),
    TWONKY_TRACKNO("itrk", null, 1), //Uses nonstandard field
    ;
    private static final Map<String, WavInfoIdentifier> CODE_TYPE_MAP = new HashMap<String, WavInfoIdentifier>();
    private static final Map<FieldKey, WavInfoIdentifier> FIELDKEY_TYPE_MAP = new HashMap<FieldKey, WavInfoIdentifier>();
    private String code;
    private FieldKey fieldKey;
    private int      preferredWriteOrder;

    WavInfoIdentifier(String code, FieldKey fieldKey, int preferredWriteOrder)
    {
        this.code = code;
        this.fieldKey = fieldKey;
        this.preferredWriteOrder=preferredWriteOrder;
    }

    public String getCode()
    {
        return code;
    }

    public FieldKey getFieldKey()
    {
        return fieldKey;
    }

    public int getPreferredWriteOrder()
    {
        return preferredWriteOrder;
    }

    /**
     * Get {@link WavInfoIdentifier} for code (e.g. "SSND").
     *
     * @param code chunk id
     * @return chunk type or {@code null} if not registered
     */
    public synchronized static WavInfoIdentifier getByCode(final String code)
    {
        if (CODE_TYPE_MAP.isEmpty())
        {
            for (final WavInfoIdentifier type : values())
            {
                CODE_TYPE_MAP.put(type.getCode(), type);
            }
        }
        return CODE_TYPE_MAP.get(code);
    }

    /**
     * Get {@link WavInfoIdentifier} for code (e.g. "SSND").
     *
     * @param fieldKey
     * @return chunk type or {@code null} if not registered
     */
    public synchronized static WavInfoIdentifier getByByFieldKey(final FieldKey fieldKey)
    {
        if (FIELDKEY_TYPE_MAP.isEmpty())
        {
            for (final WavInfoIdentifier type : values())
            {
                if (type.getFieldKey() != null)
                {
                    FIELDKEY_TYPE_MAP.put(type.getFieldKey(), type);
                }
            }
        }
        return FIELDKEY_TYPE_MAP.get(fieldKey);
    }
}
