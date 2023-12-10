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
import org.jaudiotagger.tag.TagOptionSingleton;
import org.jaudiotagger.tag.id3.AbstractID3v2Frame;
import org.jaudiotagger.tag.id3.AbstractTagFrame;
import org.jaudiotagger.tag.id3.framebody.AbstractFrameBodyTextInfo;
import org.jaudiotagger.tag.id3.framebody.FrameBodyCOMM;
import org.jaudiotagger.tag.id3.framebody.FrameBodySYLT;
import org.jaudiotagger.tag.id3.framebody.FrameBodyUSLT;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;


public class Lyrics3v2Field extends AbstractTagFrame
{
    /**
     * Creates a new Lyrics3v2Field datatype.
     */
    public Lyrics3v2Field()
    {
    }

    public Lyrics3v2Field(Lyrics3v2Field copyObject)
    {
        super(copyObject);
    }

    /**
     * Creates a new Lyrics3v2Field datatype.
     *
     * @param body
     */
    public Lyrics3v2Field(AbstractLyrics3v2FieldFrameBody body)
    {
        this.frameBody = body;
    }

    /**
     * Creates a new Lyrics3v2Field datatype.
     *
     * @param frame
     * @throws TagException
     */
    public Lyrics3v2Field(AbstractID3v2Frame frame) throws TagException
    {
        AbstractFrameBodyTextInfo textFrame;
        String text;
        String frameIdentifier = frame.getIdentifier();
        if (frameIdentifier.startsWith("USLT"))
        {
            frameBody = new FieldFrameBodyLYR("");
            ((FieldFrameBodyLYR) frameBody).addLyric((FrameBodyUSLT) frame.getBody());
        }
        else if (frameIdentifier.startsWith("SYLT"))
        {
            frameBody = new FieldFrameBodyLYR("");
            ((FieldFrameBodyLYR) frameBody).addLyric((FrameBodySYLT) frame.getBody());
        }
        else if (frameIdentifier.startsWith("COMM"))
        {
            text = ((FrameBodyCOMM) frame.getBody()).getText();
            frameBody = new FieldFrameBodyINF(text);
        }
        else if (frameIdentifier.equals("TCOM"))
        {
            textFrame = (AbstractFrameBodyTextInfo) frame.getBody();
            frameBody = new FieldFrameBodyAUT("");
            if ((textFrame != null) && (textFrame.getText().length() > 0))
            {
                frameBody = new FieldFrameBodyAUT(textFrame.getText());
            }
        }
        else if (frameIdentifier.equals("TALB"))
        {
            textFrame = (AbstractFrameBodyTextInfo) frame.getBody();
            if ((textFrame != null) && (textFrame.getText().length() > 0))
            {
                frameBody = new FieldFrameBodyEAL(textFrame.getText());
            }
        }
        else if (frameIdentifier.equals("TPE1"))
        {
            textFrame = (AbstractFrameBodyTextInfo) frame.getBody();
            if ((textFrame != null) && (textFrame.getText().length() > 0))
            {
                frameBody = new FieldFrameBodyEAR(textFrame.getText());
            }
        }
        else if (frameIdentifier.equals("TIT2"))
        {
            textFrame = (AbstractFrameBodyTextInfo) frame.getBody();
            if ((textFrame != null) && (textFrame.getText().length() > 0))
            {
                frameBody = new FieldFrameBodyETT(textFrame.getText());
            }
        }
        else
        {
            throw new TagException("Cannot createField Lyrics3v2 field from given ID3v2 frame");
        }
    }

    /**
     * Creates a new Lyrics3v2Field datatype.
     *
     * @throws InvalidTagException
     * @param byteBuffer
     */
    public Lyrics3v2Field(ByteBuffer byteBuffer) throws InvalidTagException
    {
        this.read(byteBuffer);
    }

    /**
     * @return
     */
    public String getIdentifier()
    {
        if (frameBody == null)
        {
            return "";
        }
        return frameBody.getIdentifier();
    }

    /**
     * @return
     */
    public int getSize()
    {
        return frameBody.getSize() + 5 + getIdentifier().length();
    }

    /**
     * @param byteBuffer
     * @throws InvalidTagException
     * @throws IOException
     */
    public void read(ByteBuffer byteBuffer) throws InvalidTagException
    {
        byte[] buffer = new byte[6];
        // lets scan for a non-zero byte;
        long filePointer;
        byte b;
        do
        {
            b = byteBuffer.get();
        }
        while (b == 0);
        byteBuffer.position(byteBuffer.position() - 1);
        // read the 3 character ID
        byteBuffer.get(buffer, 0, 3);
        String identifier = new String(buffer, 0, 3);
        // is this a valid identifier?
        if (!Lyrics3v2Fields.isLyrics3v2FieldIdentifier(identifier))
        {
            throw new InvalidTagException(identifier + " is not a valid ID3v2.4 frame");
        }
        frameBody = readBody(identifier, byteBuffer);
    }

    /**
     * @return
     */
    public String toString()
    {
        if (frameBody == null)
        {
            return "";
        }
        return frameBody.toString();
    }

    /**
     * @param file
     * @throws IOException
     */
    public void write(RandomAccessFile file) throws IOException
    {
        if ((frameBody.getSize() > 0) || TagOptionSingleton.getInstance().isLyrics3SaveEmptyField())
        {
            byte[] buffer = new byte[3];
            String str = getIdentifier();
            for (int i = 0; i < str.length(); i++)
            {
                buffer[i] = (byte) str.charAt(i);
            }
            file.write(buffer, 0, str.length());
            //body.write(file);
        }
    }

    /**
     * Read a Lyrics3 Field from a file.
     *
     * @param identifier
     * @param byteBuffer
     * @return
     * @throws InvalidTagException
     */
    private AbstractLyrics3v2FieldFrameBody readBody(String identifier, ByteBuffer byteBuffer) throws InvalidTagException
    {
        AbstractLyrics3v2FieldFrameBody newBody;
        if (identifier.equals(Lyrics3v2Fields.FIELD_V2_AUTHOR))
        {
            newBody = new FieldFrameBodyAUT(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_ALBUM))
        {
            newBody = new FieldFrameBodyEAL(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_ARTIST))
        {
            newBody = new FieldFrameBodyEAR(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_TRACK))
        {
            newBody = new FieldFrameBodyETT(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_IMAGE))
        {
            newBody = new FieldFrameBodyIMG(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_INDICATIONS))
        {
            newBody = new FieldFrameBodyIND(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_ADDITIONAL_MULTI_LINE_TEXT))
        {
            newBody = new FieldFrameBodyINF(byteBuffer);
        }
        else if (identifier.equals(Lyrics3v2Fields.FIELD_V2_LYRICS_MULTI_LINE_TEXT))
        {
            newBody = new FieldFrameBodyLYR(byteBuffer);
        }
        else
        {
            newBody = new FieldFrameBodyUnsupported(byteBuffer);
        }
        return newBody;
    }
}
