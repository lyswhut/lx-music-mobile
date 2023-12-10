package org.jaudiotagger.tag.mp4;

/**
 * Defines the available types of Mp4TagField, this simplifies Mp4 code because when we add a new Mp4FieldKey we can
 * define the correct type instead of having to add additional code to Mp4tag.createField method
 */
public enum Mp4TagFieldSubType
{
    TEXT,
    BYTE,
    NUMBER,
    REVERSE_DNS,
    GENRE,
    DISC_NO,
    TRACK_NO,
    ARTWORK,
    UNKNOWN
}
