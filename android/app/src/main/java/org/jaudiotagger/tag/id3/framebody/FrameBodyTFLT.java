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
 * File type Text information frame.
 *
 * <p>The 'File type' frame indicates which type of audio this tag defines.
 * The following type and refinements are defined:
 * <p><table border=0 width="70%">
 * <tr><td>MPG</td><td rowspan=8>&nbsp;</td><td width="100%">MPEG Audio</td></tr>
 * <tr><td align=right>/1   </td><td>MPEG 1/2 layer I           </td></tr>
 * <tr><td align=right>/2   </td><td>MPEG 1/2 layer II          </td></tr>
 * <tr><td align=right>/3   </td><td>MPEG 1/2 layer III         </td></tr>
 * <tr><td align=right>/2.5 </td><td>MPEG 2.5                   </td></tr>
 * <tr><td align=right>/AAC </td><td>Advanced audio compression </td></tr>
 * <tr><td>VQF</td><td>Transform-domain Weighted Interleave Vector Quantization</td></tr>
 * <tr><td>PCM              </td><td>Pulse Code Modulated audio </td></tr>
 * </table><p>
 * but other types may be used, not for these types though. This is used
 * in a similar way to the predefined types in the "TMED" frame, but
 * without parentheses. If this frame is not present audio type is
 * assumed to be "MPG".
 *
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
public class FrameBodyTFLT extends AbstractFrameBodyTextInfo implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyTFLT datatype.
     */
    public FrameBodyTFLT()
    {
    }

    public FrameBodyTFLT(FrameBodyTFLT body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTFLT datatype.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTFLT(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTFLT datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTFLT(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v24Frames.FRAME_ID_FILE_TYPE;
    }
}
