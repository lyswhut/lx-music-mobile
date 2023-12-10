package org.jaudiotagger.tag.vorbiscomment;

/**
 * Unfortunately there are two diverging values for the AlbumArtist field when used in VorbisComments
 * (as used by Ogg and Flac).e.g 'ALBUMARTIST' is the standard used by FooBar, Jaikoz, whereas JRiver and Winamp
 * prefer ALBUM ARTIST
 *
 * This option allows you to configure jaudiotaggers behaviour accordingly when reading metadata from a file
 */
public enum VorbisAlbumArtistReadOptions
{
    READ_ALBUMARTIST,
    READ_JRIVER_ALBUMARTIST,
    READ_ALBUMARTIST_THEN_JRIVER,
    READ_JRIVER_THEN_ALBUMARTIST,
    ;
}
