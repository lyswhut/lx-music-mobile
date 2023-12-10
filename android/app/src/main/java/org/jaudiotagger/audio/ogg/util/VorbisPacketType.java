package org.jaudiotagger.audio.ogg.util;

/**
 * Vorbis Packet Type
 *
 * In an Vorbis Stream there should be one instance of the three headers, and many audio packets
 */
public enum VorbisPacketType
{
    AUDIO(0),
    IDENTIFICATION_HEADER(1),
    COMMENT_HEADER(3),
    SETUP_HEADER(5);

    int type;

    VorbisPacketType(int type)
    {
        this.type = type;
    }

    public int getType()
    {
        return type;
    }
}
