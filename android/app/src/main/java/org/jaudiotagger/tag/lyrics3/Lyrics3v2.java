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

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.TagException;
import org.jaudiotagger.tag.TagNotFoundException;
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.id3.AbstractID3v2Frame;
import org.jaudiotagger.tag.id3.AbstractTag;
import org.jaudiotagger.tag.id3.ID3v1Tag;
import org.jaudiotagger.tag.id3.ID3v24Tag;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.util.HashMap;
import java.util.Iterator;

public class Lyrics3v2 extends AbstractLyrics3
{
    /**
     *
     */
    private HashMap<String, Lyrics3v2Field> fieldMap = new HashMap<String, Lyrics3v2Field>();

    /**
     * Creates a new Lyrics3v2 datatype.
     */
    public Lyrics3v2()
    {
    }

    public Lyrics3v2(Lyrics3v2 copyObject)
    {
        super(copyObject);

        Iterator<String> iterator = copyObject.fieldMap.keySet().iterator();
        String oldIdentifier;
        String newIdentifier;
        Lyrics3v2Field newObject;

        while (iterator.hasNext())
        {
            oldIdentifier = iterator.next();
            newIdentifier = oldIdentifier;
            newObject = new Lyrics3v2Field(copyObject.fieldMap.get(newIdentifier));
            fieldMap.put(newIdentifier, newObject);
        }
    }

    /**
     * Creates a new Lyrics3v2 datatype.
     *
     * @param mp3tag
     * @throws UnsupportedOperationException
     */
    public Lyrics3v2(AbstractTag mp3tag)
    {
        if (mp3tag != null)
        {
            // upgrade the tag to lyrics3v2
            if (mp3tag instanceof Lyrics3v2)
            {
                throw new UnsupportedOperationException("Copy Constructor not called. Please type cast the argument");
            }
            else if (mp3tag instanceof Lyrics3v1)
            {
                Lyrics3v1 lyricOld = (Lyrics3v1) mp3tag;
                Lyrics3v2Field newField;
                newField = new Lyrics3v2Field(new FieldFrameBodyLYR(lyricOld.getLyric()));
                fieldMap.put(newField.getIdentifier(), newField);
            }
            else
            {
                Lyrics3v2Field newField;
                Iterator<AbstractID3v2Frame> iterator;
                iterator = (new ID3v24Tag(mp3tag)).iterator();

                while (iterator.hasNext())
                {
                    try
                    {
                        newField = new Lyrics3v2Field(iterator.next());

                        if (newField != null)
                        {
                            fieldMap.put(newField.getIdentifier(), newField);
                        }
                    }
                    catch (TagException ex)
                    {
                        //invalid frame to createField lyrics3 field. ignore and keep going
                    }
                }
            }
        }
    }

    /**
     * Creates a new Lyrics3v2 datatype.
     *
     * @throws TagNotFoundException
     * @throws IOException
     * @param byteBuffer
     */
    public Lyrics3v2(ByteBuffer byteBuffer) throws TagNotFoundException, IOException
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
     * @param field
     */
    public void setField(Lyrics3v2Field field)
    {
        fieldMap.put(field.getIdentifier(), field);
    }

    /**
     * Gets the value of the frame identified by identifier
     *
     * @param identifier The three letter code
     * @return The value associated with the identifier
     */
    public Lyrics3v2Field getField(String identifier)
    {
        return fieldMap.get(identifier);
    }

    /**
     * @return
     */
    public int getFieldCount()
    {
        return fieldMap.size();
    }

    /**
     * @return
     */
    public String getIdentifier()
    {
        return "Lyrics3v2.00";
    }

    /**
     * @return
     */
    public int getSize()
    {
        int size = 0;
        Iterator<Lyrics3v2Field> iterator = fieldMap.values().iterator();
        Lyrics3v2Field field;

        while (iterator.hasNext())
        {
            field = iterator.next();
            size += field.getSize();
        }

        // include LYRICSBEGIN, but not 6 char size or LYRICSEND
        return 11 + size;
    }


    /**
     * @param obj
     * @return
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof Lyrics3v2))
        {
            return false;
        }

        Lyrics3v2 object = (Lyrics3v2) obj;

        return this.fieldMap.equals(object.fieldMap) && super.equals(obj);

    }

    /**
     * @param identifier
     * @return
     */
    public boolean hasField(String identifier)
    {
        return fieldMap.containsKey(identifier);
    }

    /**
     * @return
     */
    public Iterator<Lyrics3v2Field> iterator()
    {
        return fieldMap.values().iterator();
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


    public void read(ByteBuffer byteBuffer) throws TagException
    {
        long filePointer;
        int lyricSize;

        if (seek(byteBuffer))
        {
            lyricSize = seekSize(byteBuffer);
        }
        else
        {
            throw new TagNotFoundException("Lyrics3v2.00 Tag Not Found");
        }

        // reset file pointer to the beginning of the tag;
        seek(byteBuffer);
        filePointer = byteBuffer.position();

        fieldMap = new HashMap<String, Lyrics3v2Field>();

        Lyrics3v2Field lyric;

        // read each of the fields
        while ((byteBuffer.position()) < (lyricSize - 11))
        {
            try
            {
                lyric = new Lyrics3v2Field(byteBuffer);
                setField(lyric);
            }
            catch (InvalidTagException ex)
            {
                // keep reading until we're done
            }
        }
    }

    /**
     * @param identifier
     */
    public void removeField(String identifier)
    {
        fieldMap.remove(identifier);
    }

    /**
     * @param file
     * @return
     * @throws IOException
     */
    public boolean seek(RandomAccessFile file) throws IOException
    {
        byte[] buffer = new byte[11];
        String lyricEnd;
        String lyricStart;
        long filePointer;
        long lyricSize;

        // check right before the ID3 1.0 tag for the lyrics tag
        file.seek(file.length() - 128 - 9);
        file.read(buffer, 0, 9);
        lyricEnd = new String(buffer, 0, 9);

        if (lyricEnd.equals("LYRICS200"))
        {
            filePointer = file.getFilePointer();
        }
        else
        {
            // check the end of the file for a lyrics tag incase an ID3
            // tag wasn't placed after it.
            file.seek(file.length() - 9);
            file.read(buffer, 0, 9);
            lyricEnd = new String(buffer, 0, 9);

            if (lyricEnd.equals("LYRICS200"))
            {
                filePointer = file.getFilePointer();
            }
            else
            {
                return false;
            }
        }

        // read the 6 bytes for the length of the tag
        filePointer -= (9 + 6);
        file.seek(filePointer);
        file.read(buffer, 0, 6);

        lyricSize = Integer.parseInt(new String(buffer, 0, 6));

        // read the lyrics begin tag if it exists.
        file.seek(filePointer - lyricSize);
        file.read(buffer, 0, 11);
        lyricStart = new String(buffer, 0, 11);

        return lyricStart.equals("LYRICSBEGIN");
    }

    /**
     * @return
     */
    public String toString()
    {
        Iterator<Lyrics3v2Field> iterator = fieldMap.values().iterator();
        Lyrics3v2Field field;
        String str = getIdentifier() + " " + this.getSize() + "\n";

        while (iterator.hasNext())
        {
            field = iterator.next();
            str += (field.toString() + "\n");
        }

        return str;
    }

    /**
     * @param identifier
     */
    public void updateField(String identifier)
    {
        Lyrics3v2Field lyrField;

        if (identifier.equals("IND"))
        {
            boolean lyricsPresent = fieldMap.containsKey("LYR");
            boolean timeStampPresent = false;

            if (lyricsPresent)
            {
                lyrField = fieldMap.get("LYR");

                FieldFrameBodyLYR lyrBody = (FieldFrameBodyLYR) lyrField.getBody();
                timeStampPresent = lyrBody.hasTimeStamp();
            }

            lyrField = new Lyrics3v2Field(new FieldFrameBodyIND(lyricsPresent, timeStampPresent));
            setField(lyrField);
        }
    }

    /**
     * @param file
     * @throws IOException
     */
    public void write(RandomAccessFile file) throws IOException
    {
        int offset = 0;

        long size;
        long filePointer;
        byte[] buffer = new byte[6 + 9];

        String str;
        Lyrics3v2Field field;
        Iterator<Lyrics3v2Field> iterator;
        ID3v1Tag id3v1tag;
        new ID3v1Tag();

        id3v1tag = null;

        delete(file);
        file.seek(file.length());

        filePointer = file.getFilePointer();

        str = "LYRICSBEGIN";

        for (int i = 0; i < str.length(); i++)
        {
            buffer[i] = (byte) str.charAt(i);
        }

        file.write(buffer, 0, str.length());

        // IND needs to go first. lets createField/update it and write it first.
        updateField("IND");
        field = fieldMap.get("IND");
        field.write(file);

        iterator = fieldMap.values().iterator();

        while (iterator.hasNext())
        {
            field = iterator.next();

            String id = field.getIdentifier();
            boolean save = TagOptionSingleton.getInstance().getLyrics3SaveField(id);

            if ((!id.equals("IND")) && save)
            {
                field.write(file);
            }
        }

        size = file.getFilePointer() - filePointer;

        if (this.getSize() != size)
        {
            //logger.config("Lyrics3v2 size didn't match up while writing.");
            //logger.config("this.getsize()     = " + this.getSize());
            //logger.config("size (filePointer) = " + size);
        }

        str = Long.toString(size);

        for (int i = 0; i < (6 - str.length()); i++)
        {
            buffer[i] = (byte) '0';
        }

        offset += (6 - str.length());

        for (int i = 0; i < str.length(); i++)
        {
            buffer[i + offset] = (byte) str.charAt(i);
        }

        offset += str.length();

        str = "LYRICS200";

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

    /**
     * TODO
     * @param byteBuffer
     * @return
     */
    private int seekSize(ByteBuffer byteBuffer)
    {
        /*
        byte[] buffer = new byte[11];
        String lyricEnd = "";
        long filePointer = 0;

        // check right before the ID3 1.0 tag for the lyrics tag
        file.seek(file.length() - 128 - 9);
        file.read(buffer, 0, 9);
        lyricEnd = new String(buffer, 0, 9);

        if (lyricEnd.equals("LYRICS200"))
        {
            filePointer = file.getFilePointer();
        }
        else
        {
            // check the end of the file for a lyrics tag incase an ID3
            // tag wasn't placed after it.
            file.seek(file.length() - 9);
            file.read(buffer, 0, 9);
            lyricEnd = new String(buffer, 0, 9);

            if (lyricEnd.equals("LYRICS200"))
            {
                filePointer = file.getFilePointer();
            }
            else
            {
                return -1;
            }
        }

        // read the 6 bytes for the length of the tag
        filePointer -= (9 + 6);
        file.seek(filePointer);
        file.read(buffer, 0, 6);

        return Integer.parseInt(new String(buffer, 0, 6));
        */
        return -1;
    }
}