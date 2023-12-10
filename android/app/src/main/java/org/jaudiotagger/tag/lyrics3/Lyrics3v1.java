/**
 *  @author : Paul Taylor
 *  @author : Eric Farng
 *
 *  Version @version:$Id$
 *
 *  MusicTag Copyright (C)2003,2004
 *
 *  This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 *  General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 *  or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 *  the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 *  you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 */

package org.jaudiotagger.tag.lyrics3;

import org.jaudiotagger.tag.TagException;
import org.jaudiotagger.tag.TagNotFoundException;
import org.jaudiotagger.tag.id3.AbstractTag;
import org.jaudiotagger.tag.id3.ID3Tags;
import org.jaudiotagger.tag.id3.ID3v1Tag;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.util.Iterator;

public class Lyrics3v1 extends AbstractLyrics3
{
    /**
     *
     */
    private String lyric = "";

    /**
     * Creates a new Lyrics3v1 datatype.
     */
    public Lyrics3v1()
    {
    }

    public Lyrics3v1(Lyrics3v1 copyObject)
    {
        super(copyObject);
        this.lyric = copyObject.lyric;
    }

    public Lyrics3v1(AbstractTag mp3Tag)
    {
        if (mp3Tag != null)
        {
            Lyrics3v2 lyricTag;

            if (mp3Tag instanceof Lyrics3v1)
            {
                throw new UnsupportedOperationException("Copy Constructor not called. Please type cast the argument");
            }
            else if (mp3Tag instanceof Lyrics3v2)
            {
                lyricTag = (Lyrics3v2) mp3Tag;
            }
            else
            {
                lyricTag = new Lyrics3v2(mp3Tag);
            }

            FieldFrameBodyLYR lyricField;
            lyricField = (FieldFrameBodyLYR) lyricTag.getField("LYR").getBody();
            this.lyric = lyricField.getLyric();
        }
    }

    /**
     * Creates a new Lyrics3v1 datatype.
     *
     * @throws TagNotFoundException
     * @throws IOException
     * @param byteBuffer
     */
    public Lyrics3v1(ByteBuffer byteBuffer) throws TagNotFoundException, IOException
    {
        try
        {
            this.read(byteBuffer);
        }
        catch (TagException e)
        {
            e.printStackTrace();
        }
    }

    /**
     * @return
     */
    public String getIdentifier()
    {
        return "Lyrics3v1.00";
    }

    /**
     * @param lyric
     */
    public void setLyric(String lyric)
    {
        this.lyric = ID3Tags.truncate(lyric, 5100);
    }

    /**
     * @return
     */
    public String getLyric()
    {
        return lyric;
    }

    /**
     * @return
     */
    public int getSize()
    {
        return "LYRICSBEGIN".length() + lyric.length() + "LYRICSEND".length();
    }

    /**
     * @param obj
     * @return
     */
    public boolean isSubsetOf(Object obj)
    {
        return (obj instanceof Lyrics3v1) && (((Lyrics3v1) obj).lyric.contains(this.lyric));

    }

    /**
     * @param obj
     * @return
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof Lyrics3v1))
        {
            return false;
        }

        Lyrics3v1 object = (Lyrics3v1) obj;

        return this.lyric.equals(object.lyric) && super.equals(obj);

    }

    /**
     * @return
     * @throws UnsupportedOperationException
     *
     */
    public Iterator iterator()
    {
        /**
         * @todo Implement this org.jaudiotagger.tag.AbstractMP3Tag abstract method
         */
        throw new UnsupportedOperationException("Method iterator() not yet implemented.");
    }

    /**
     * TODO implement
     *
     * @param byteBuffer
     * @return
     * @throws IOException
     */
    public boolean seek(ByteBuffer byteBuffer)
    {
        return false;
    }

    /**
     * @param byteBuffer
     * @throws TagNotFoundException
     * @throws IOException
     */
    public void read(ByteBuffer byteBuffer) throws TagException
    {
        byte[] buffer = new byte[5100 + 9 + 11];
        String lyricBuffer;

        if (!seek(byteBuffer))
        {
            throw new TagNotFoundException("ID3v1 tag not found");
        }

        byteBuffer.get(buffer);
        lyricBuffer = new String(buffer);

        lyric = lyricBuffer.substring(0, lyricBuffer.indexOf("LYRICSEND"));
    }

    /**
     * @param file
     * @return
     * @throws IOException
     */
    public boolean seek(RandomAccessFile file) throws IOException
    {
        byte[] buffer = new byte[5100 + 9 + 11];
        String lyricsEnd;
        String lyricsStart;
        long offset;

        // check right before the ID3 1.0 tag for the lyrics tag
        file.seek(file.length() - 128 - 9);
        file.read(buffer, 0, 9);
        lyricsEnd = new String(buffer, 0, 9);

        if (lyricsEnd.equals("LYRICSEND"))
        {
            offset = file.getFilePointer();
        }
        else
        {
            // check the end of the file for a lyrics tag incase an ID3
            // tag wasn't placed after it.
            file.seek(file.length() - 9);
            file.read(buffer, 0, 9);
            lyricsEnd = new String(buffer, 0, 9);

            if (lyricsEnd.equals("LYRICSEND"))
            {
                offset = file.getFilePointer();
            }
            else
            {
                return false;
            }
        }

        // the tag can at most only be 5100 bytes
        offset -= (5100 + 9 + 11);
        file.seek(offset);
        file.read(buffer);
        lyricsStart = new String(buffer);

        // search for the tag
        int i = lyricsStart.indexOf("LYRICSBEGIN");

        if (i == -1)
        {
            return false;
        }

        file.seek(offset + i + 11);

        return true;
    }

    /**
     * @return
     */
    public String toString()
    {
        String str = getIdentifier() + " " + this.getSize() + "\n";

        return str + lyric;
    }

    /**
     * @param file
     * @throws IOException
     */
    public void write(RandomAccessFile file) throws IOException
    {
        String str;
        int offset;
        byte[] buffer;
        ID3v1Tag id3v1tag;

        id3v1tag = null;

        delete(file);
        file.seek(file.length());

        buffer = new byte[lyric.length() + 11 + 9];

        str = "LYRICSBEGIN";

        for (int i = 0; i < str.length(); i++)
        {
            buffer[i] = (byte) str.charAt(i);
        }

        offset = str.length();

        str = ID3Tags.truncate(lyric, 5100);

        for (int i = 0; i < str.length(); i++)
        {
            buffer[i + offset] = (byte) str.charAt(i);
        }

        offset += str.length();

        str = "LYRICSEND";

        for (int i = 0; i < str.length(); i++)
        {
            buffer[i + offset] = (byte) str.charAt(i);
        }

        offset += str.length();

        file.write(buffer, 0, offset);

        if (id3v1tag != null)
        {
            id3v1tag.write(file);
        }
    }

}