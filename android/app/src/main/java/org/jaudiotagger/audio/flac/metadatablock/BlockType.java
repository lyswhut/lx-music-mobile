package org.jaudiotagger.audio.flac.metadatablock;

/**
 * The different types of metadata block
 *
 * 7 - 126 are reserved for future use
 * 127 is invalid
 * User: Paul Taylor
 * Date: 21-Nov-2007
 */
public enum BlockType
{
    STREAMINFO(0),
    PADDING(1),
    APPLICATION(2),
    SEEKTABLE(3),
    VORBIS_COMMENT(4),
    CUESHEET(5),
    PICTURE(6);

    private int id;

    BlockType(int id)
    {
        this.id = id;
    }

    public int getId()
    {
        return id;
    }
}
