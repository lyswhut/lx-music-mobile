package org.jaudiotagger.tag.vorbiscomment;

/**
 * Unfortunately there are two diverging values for the AlbumArtist field when used in VorbisComments
 * (as used by Ogg and Flac).e.g 'ALBUMARTIST' is the standard used by FooBar, Jaikoz, whereas JRiver and Winamp
 * prefer ALBUM ARTIST
 *
 * This option allows you to configure jaudiotaggers behaviour accordingly
 */
public enum VorbisAlbumArtistSaveOptions
{
    WRITE_ALBUMARTIST,
    WRITE_JRIVER_ALBUMARTIST,
    WRITE_BOTH,
    WRITE_ALBUMARTIST_AND_DELETE_JRIVER_ALBUMARTIST,
    WRITE_JRIVER_ALBUMARTIST_AND_DELETE_ALBUMARTIST,
    ;
}
