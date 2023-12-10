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

 *
 */
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.StringSizeTerminated;

import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.CharsetEncoder;

/**
 * Abstract super class of all URL Frames
 */
public abstract class AbstractFrameBodyUrlLink extends AbstractID3v2FrameBody
{

    /**
     * Creates a new FrameBodyUrlLink datatype.
     */
    protected AbstractFrameBodyUrlLink()
    {
        super();
    }

    /**
     * Copy Constructor
     * @param body
     */
    protected AbstractFrameBodyUrlLink(AbstractFrameBodyUrlLink body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyUrlLink datatype., set up with data.
     *
     * @param urlLink
     */
    public AbstractFrameBodyUrlLink(String urlLink)
    {
        setObjectValue(DataTypes.OBJ_URLLINK, urlLink);
    }

    /**
     * Creates a new FrameBodyUrlLink datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException if unable to create framebody from buffer
     */
    protected AbstractFrameBodyUrlLink(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
    }

    public String getUserFriendlyValue()
    {
        return getUrlLink();
    }

    /**
     * Set URL Link
     *
     * @param urlLink
     */
    public void setUrlLink(String urlLink)
    {
        if (urlLink == null)
        {
            throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
        }
        setObjectValue(DataTypes.OBJ_URLLINK, urlLink);
    }

    /**
     * Get URL Link
     *
     * @return the urllink
     */
    public String getUrlLink()
    {
        return (String) getObjectValue(DataTypes.OBJ_URLLINK);
    }

    /**
     * If the description cannot be encoded using the current encoding change the encoder
     */
    public void write(ByteArrayOutputStream tagBuffer)
    {
        CharsetEncoder encoder = StandardCharsets.ISO_8859_1.newEncoder();
        String origUrl = getUrlLink();
        if (!encoder.canEncode(origUrl))
        {
            //ALL W Frames only support ISO-8859-1 for the url itself, if unable to encode let us assume
            //the link just needs url encoding
            setUrlLink(encodeURL(origUrl));

            //We still cant convert so just set log error and set to blank to allow save to continue
            if (!encoder.canEncode(getUrlLink()))
            {
                logger.warning(ErrorMessage.MP3_UNABLE_TO_ENCODE_URL.getMsg(origUrl));
                setUrlLink("");
            }
            //it was ok, just note the modification made
            else
            {
                logger.warning(ErrorMessage.MP3_URL_SAVED_ENCODED.getMsg(origUrl, getUrlLink()));
            }
        }
        super.write(tagBuffer);
    }

    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new StringSizeTerminated(DataTypes.OBJ_URLLINK, this));
    }

    /**
     * Encode url because may receive url already encoded or not, but we can only store as ISO8859-1
     *
     * @param url
     * @return
     */
    private String encodeURL(String url)
    {
        try
        {
            final String[] splitURL = url.split("(?<!/)/(?!/)", -1);
            final StringBuffer sb = new StringBuffer(splitURL[0]);
            for (int i = 1; i < splitURL.length; i++)
            {
                sb.append("/").append(URLEncoder.encode(splitURL[i], "utf-8"));
            }
            return sb.toString();
        }
        catch (UnsupportedEncodingException uee)
        {
            //Should never happen as utf-8 is always availablebut in case it does we just return the utl
            //unmodified
            logger.warning("Uable to url encode because utf-8 charset not available:" + uee.getMessage());
            return url;
        }
    }
}