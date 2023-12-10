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
 * Length Text information frame.
 * <p>The 'Media type' frame describes from which media the sound
 * originated. This may be a text string or a reference to the
 * predefined media types found in the list below. References are made
 * within "(" and ")" and are optionally followed by a text refinement,
 * e.g. "(MC) with four channels". If a text refinement should begin
 * with a "(" character it should be replaced with "((" in the same way
 * as in the "TCO" frame. Predefined refinements is appended after the
 * media type, e.g. "(CD/A)" or "(VID/PAL/VHS)".</div>
 * <p><table border=0 width="70%">
 * <tr><td>DIG</td><td rowspan=67>&nbsp;</td><td width="100%">Other digital media</td></tr>
 * <tr valign=top><td align=right>/A<br>&nbsp;</td><td>Analog transfer from media</td></tr>
 * <tr><td>ANA</td><td>Other analog media</td></tr>
 * <tr><td align=right>/WAC</td><td>Wax cylinder</td></tr>
 * <tr valign=top><td align=right>/8CA<br>&nbsp;</td><td>8-track tape cassette</td></tr>
 * <tr><td>CD</td><td>CD</td></tr>
 * <tr><td align=right>/A</td><td>Analog transfer from media</td></tr>
 * <tr><td align=right>/DD</td><td>DDD</td></tr>
 * <tr><td align=right>/AD</td><td>ADD</td></tr>
 * <tr valign=top><td align=right>/AA<br>&nbsp;</td><td>AAD</td></tr>
 * <tr><td>LD</td><td>Laserdisc</td></tr>
 * <tr valign=top><td align=right>/A<br>&nbsp;</td><td>Analog transfer from media</td></tr>
 * <tr><td>TT</td><td>Turntable records</td></tr>
 * <tr><td align=right>/33</td><td>33.33 rpm</td></tr>
 * <tr><td align=right>/45</td><td>45 rpm</td></tr>
 * <tr><td align=right>/71</td><td>71.29 rpm</td></tr>
 * <tr><td align=right>/76</td><td>76.59 rpm</td></tr>
 * <tr><td align=right>/78</td><td>78.26 rpm</td></tr>
 * <tr valign=top><td align=right>/80<br>&nbsp;</td><td>80 rpm</td></tr>
 * <tr><td>MD</td><td>MiniDisc</td></tr>
 * <tr valign=top><td align=right>/A<br>&nbsp;</td><td>Analog transfer from media</td></tr>
 * <tr><td>DAT</td><td>DAT</td></tr>
 * <tr><td align=right>/A</td><td>Analog transfer from media</td></tr>
 * <tr><td align=right>/1</td><td>standard, 48 kHz/16 bits, linear</td></tr>
 * <tr><td align=right>/2</td><td>mode 2, 32 kHz/16 bits, linear</td></tr>
 * <tr><td align=right>/3</td><td>mode 3, 32 kHz/12 bits, nonlinear, low speed</td></tr>
 * <tr><td align=right>/4</td><td>mode 4, 32 kHz/12 bits, 4 channels</td></tr>
 * <tr><td align=right>/5</td><td>mode 5, 44.1 kHz/16 bits, linear</td></tr>
 * <tr valign=top><td align=right>/6<br>&nbsp;</td><td>mode 6, 44.1 kHz/16 bits, 'wide track' play</td></tr>
 * <tr><td>DCC</td><td>DCC</td></tr>
 * <tr valign=top><td align=right>/A<br>&nbsp;</td><td>Analog transfer from media</td></tr>
 * <tr><td>DVD</td><td>DVD</td></tr>
 * <tr valign=top><td align=right>/A<br>&nbsp;</td><td>Analog transfer from media</td></tr>
 * <tr><td>TV</td><td>Television</td></tr>
 * <tr><td align=right>/PAL</td><td>PAL</td></tr>
 * <tr><td align=right>/NTSC</td><td>NTSC</td></tr>
 * <tr valign=top><td align=right>&nbsp;/SECAM<br>&nbsp;</td><td>SECAM</td></tr>
 * <tr><td>VID</td><td>Video</td></tr>
 * <tr><td align=right>/PAL</td><td>PAL</td></tr>
 * <tr><td align=right>/NTSC</td><td>NTSC</td></tr>
 * <tr><td align=right>/SECAM</td><td>SECAM</td></tr>
 * <tr><td align=right>/VHS</td><td>VHS</td></tr>
 * <tr><td align=right>/SVHS</td><td>S-VHS</td></tr>
 * <tr valign=top><td align=right>/BETA<br>&nbsp;</td><td>BETAMAX</td></tr>
 * <tr><td>RAD</td><td>Radio</td></tr>
 * <tr><td align=right>/FM</td><td>FM</td></tr>
 * <tr><td align=right>/AM</td><td>AM</td></tr>
 * <tr><td align=right>/LW</td><td>LW</td></tr>
 * <tr valign=top><td align=right>/MW<br>&nbsp;</td><td>MW</td></tr>
 * <tr><td>TEL</td><td>Telephone</td></tr>
 * <tr valign=top><td align=right>/I<br>&nbsp;</td><td>ISDN</td></tr>
 * <tr><td>MC</td><td>MC (normal cassette)</td></tr>
 * <tr><td align=right>/4</td><td>4.75 cm/s (normal speed for a two sided cassette)</td></tr>
 * <tr><td align=right>/9</td><td>9.5 cm/s</td></tr>
 * <tr><td align=right>/I</td><td>Type I cassette (ferric/normal)</td></tr>
 * <tr><td align=right>/II</td><td>Type II cassette (chrome)</td></tr>
 * <tr><td align=right>/III</td><td>Type III cassette (ferric chrome)</td></tr>
 * <tr valign=top><td align=right>/IV<br>&nbsp;</td><td>Type IV cassette (metal)</td></tr>
 * <tr><td>REE</td><td>Reel</td></tr>
 * <tr><td align=right>/9</td><td>9.5 cm/s</td></tr>
 * <tr><td align=right>/19</td><td>19 cm/s</td></tr>
 * <tr><td align=right>/38</td><td>38 cm/s</td></tr>
 * <tr><td align=right>/76</td><td>76 cm/s</td></tr>
 * <tr><td align=right>/I</td><td>Type I cassette (ferric/normal)</td></tr>
 * <tr><td align=right>/II</td><td>Type II cassette (chrome)</td></tr>
 * <tr><td align=right>/III</td><td>Type III cassette (ferric chrome)</td></tr>
 * <tr><td align=right>/IV<br>&nbsp;</td><td>Type IV cassette (metal)</td></tr>
 * </table>
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
public class FrameBodyTMED extends AbstractFrameBodyTextInfo implements ID3v23FrameBody, ID3v24FrameBody
{
    /**
     * Creates a new FrameBodyTMED datatype.
     */
    public FrameBodyTMED()
    {
    }

    public FrameBodyTMED(FrameBodyTMED body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTMED datatype.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTMED(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTMED datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTMED(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v24Frames.FRAME_ID_MEDIA_TYPE;
    }
}
