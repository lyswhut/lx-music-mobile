package org.jaudiotagger.audio.mp4.atom;

/**
 * Some mp4s contain null padding at the end of the file, possibly do with gapless playback. This is not really
 * allowable but seeing as seems to cccur in files encoded with iTunes 6 and players such as Winamp and iTunes deal
 * with it we should
 *
 * It isnt actually a box, but it helps to keep as a subclass of this type
 */
public class NullPadding extends Mp4BoxHeader
{

    public NullPadding(long startPosition,long fileSize)
    {
        setFilePos(startPosition);
        length=((int)(fileSize - startPosition));
    }
}
