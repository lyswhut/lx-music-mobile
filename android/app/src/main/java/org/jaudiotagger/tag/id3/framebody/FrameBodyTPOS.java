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
 * Part of a set Text information frame.
 *
 * <p>The 'Part of a set' frame is a numeric string that describes which part of a set the audio came from.
 * This frame is used if the source described in the "TALB" frame is divided into several mediums, e.g. a double CD.
 * The value may be extended with a "/" character and a numeric string containing the total number of parts in the set.
 * e.g. "1/2".
 *
 * <p>For more details, please refer to the ID3 specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2.3.0.txt">ID3 v2.3.0 Spec</a>
 * </ul>
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class FrameBodyTPOS extends AbstractFrameBodyNumberTotal implements ID3v23FrameBody, ID3v24FrameBody
{
    /**
     * Creates a new FrameBodyTRCK datatype.
     */
    public FrameBodyTPOS()
    {
        super();
    }

    public FrameBodyTPOS(FrameBodyTPOS body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTRCK datatype, the value is parsed literally
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTPOS(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    public FrameBodyTPOS(byte textEncoding, Integer discNo,Integer discTotal)
    {
        super(textEncoding, discNo, discTotal);
    }

    /**
     * Creates a new FrameBodyTRCK datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws java.io.IOException
     * @throws InvalidTagException
     */
    public FrameBodyTPOS(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_SET;
    }

    public Integer getDiscNo()
    {
        return getNumber();
    }

    public String getDiscNoAsText()
    {
        return getNumberAsText();
    }

    public void setDiscNo(Integer discNo)
    {
        setNumber(discNo);
    }

    public void setDiscNo(String discNo)
    {
        setNumber(discNo);
    }


    public Integer getDiscTotal()
    {
        return getTotal();
    }

    public String getDiscTotalAsText()
    {
        return getTotalAsText();
    }

    public void setDiscTotal(Integer discTotal)
    {
         setTotal(discTotal);
    }

    public void setDiscTotal(String discTotal)
    {
         setTotal(discTotal);
    }

}
