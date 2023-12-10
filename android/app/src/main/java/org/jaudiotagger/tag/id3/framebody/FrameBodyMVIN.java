/*
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
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.id3.ID3v24Frames;

import java.nio.ByteBuffer;

/**
 * Apple defined Movement No/Total frame works the same way as the TRCK frame
 *
 * This is not an official standard frame, but Apple makes its own rules !
 *
 * @author : Paul Taylor
 */
public class FrameBodyMVIN extends AbstractFrameBodyNumberTotal implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyTALB datatype.
     */
    public FrameBodyMVIN()
    {
    }

    public FrameBodyMVIN(FrameBodyMVIN body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTALB datatype.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyMVIN(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTALB datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws org.jaudiotagger.tag.InvalidTagException if unable to create framebody from buffer
     */
    public FrameBodyMVIN(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    public FrameBodyMVIN(byte textEncoding, Integer movementNo, Integer movementTotal)
    {
        super(textEncoding, movementNo, movementTotal);
    }


    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_MOVEMENT_NO;
    }

}
