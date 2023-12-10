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
 *
 */
package org.jaudiotagger.tag.datatype;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.id3.AbstractTagFrameBody;

import java.util.Iterator;
import java.util.LinkedList;

public class Lyrics3Line extends AbstractDataType
{
    /**
     *
     */
    private LinkedList<Lyrics3TimeStamp> timeStamp = new LinkedList<Lyrics3TimeStamp>();

    /**
     *
     */
    private String lyric = "";

    /**
     * Creates a new ObjectLyrics3Line datatype.
     *
     * @param identifier
     * @param frameBody
     */
    public Lyrics3Line(String identifier, AbstractTagFrameBody frameBody)
    {
        super(identifier, frameBody);
    }

    public Lyrics3Line(Lyrics3Line copy)
    {
        super(copy);
        this.lyric = copy.lyric;
        Lyrics3TimeStamp newTimeStamp;
        for (int i = 0; i < copy.timeStamp.size(); i++)
        {
            newTimeStamp = new Lyrics3TimeStamp(copy.timeStamp.get(i));
            this.timeStamp.add(newTimeStamp);
        }
    }

    public void setLyric(String lyric)
    {
        this.lyric = lyric;
    }

    public void setLyric(ID3v2LyricLine line)
    {
        this.lyric = line.getText();
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
        int size = 0;
        for (Object aTimeStamp : timeStamp)
        {
            size += ((Lyrics3TimeStamp) aTimeStamp).getSize();
        }
        return size + lyric.length();
    }

    /**
     * @param time
     */
    public void setTimeStamp(Lyrics3TimeStamp time)
    {
        timeStamp.clear();
        timeStamp.add(time);
    }

    /**
     * @return
     */
    public Iterator<Lyrics3TimeStamp> getTimeStamp()
    {
        return timeStamp.iterator();
    }

    public void addLyric(String newLyric)
    {
        this.lyric += newLyric;
    }

    public void addLyric(ID3v2LyricLine line)
    {
        this.lyric += line.getText();
    }

    /**
     * @param time
     */
    public void addTimeStamp(Lyrics3TimeStamp time)
    {
        timeStamp.add(time);
    }

    /**
     * @param obj
     * @return
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof Lyrics3Line))
        {
            return false;
        }
        Lyrics3Line object = (Lyrics3Line) obj;
        if (!this.lyric.equals(object.lyric))
        {
            return false;
        }
        return this.timeStamp.equals(object.timeStamp) && super.equals(obj);
    }

    /**
     * @return
     */
    public boolean hasTimeStamp()
    {
        return !timeStamp.isEmpty();
    }

    /**
     * @param lineString
     * @param offset
     * @throws NullPointerException
     * @throws IndexOutOfBoundsException
     */
    public void readString(String lineString, int offset)
    {
        if (lineString == null)
        {
            throw new NullPointerException("Image is null");
        }
        if ((offset < 0) || (offset >= lineString.length()))
        {
            throw new IndexOutOfBoundsException("Offset to line is out of bounds: offset = " + offset + ", line.length()" + lineString.length());
        }
        int delim;
        Lyrics3TimeStamp time;
        timeStamp = new LinkedList<Lyrics3TimeStamp>();
        delim = lineString.indexOf("[", offset);
        while (delim >= 0)
        {
            offset = lineString.indexOf("]", delim) + 1;
            time = new Lyrics3TimeStamp("Time Stamp");
            time.readString(lineString.substring(delim, offset));
            timeStamp.add(time);
            delim = lineString.indexOf("[", offset);
        }
        lyric = lineString.substring(offset);
    }

    /**
     * @return
     */
    public String toString()
    {
        String str = "";
        for (Object aTimeStamp : timeStamp)
        {
            str += aTimeStamp.toString();
        }
        return "timeStamp = " + str + ", lyric = " + lyric + "\n";
    }

    /**
     * @return
     */
    public String writeString()
    {
        String str = "";
        Lyrics3TimeStamp time;
        for (Object aTimeStamp : timeStamp)
        {
            time = (Lyrics3TimeStamp) aTimeStamp;
            str += time.writeString();
        }
        return str + lyric;
    }

    public void readByteArray(byte[] arr, int offset) throws InvalidDataTypeException
    {
        readString(arr.toString(), offset);
    }

    public byte[] writeByteArray()
    {
        return writeString().getBytes(StandardCharsets.ISO_8859_1);
    }
}
