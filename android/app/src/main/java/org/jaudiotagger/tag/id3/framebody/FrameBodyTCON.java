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
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.datatype.NumberHashMap;
import org.jaudiotagger.tag.datatype.TCONString;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.ID3V2ExtendedGenreTypes;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;
import org.jaudiotagger.tag.reference.GenreTypes;

import java.nio.ByteBuffer;

/**
 * Content type Text information frame.
 *
 * <p>The 'Content type', which previously was
 * stored as a one byte numeric value only, is now a numeric string. You
 * may use one or several of the types as ID3v1.1 did or, since the
 * category list would be impossible to maintain with accurate and up to
 * date categories, define your own.
 * <p>
 * ID3V23:References to the ID3v1 genres can be made by, as first byte, enter
 * "(" followed by a number from the genres list (appendix A) and
 * ended with a ")" character. This is optionally followed by a
 * refinement, e.g. "(21)" or "(4)Eurodisco". Several references can be
 * made in the same frame, e.g. "(51)(39)". If the refinement should
 * begin with a "(" character it should be replaced with "((", e.g. "((I
 * can figure out any genre)" or "(55)((I think...)". The following new
 * content types is defined in ID3v2 and is implemented in the same way
 * as the numeric content types, e.g. "(RX)".
 * <p><table border=0 width="70%">
 * <tr><td>RX</td><td width="100%">Remix</td></tr>
 * <tr><td>CR</td><td>Cover</td></tr>
 * </table>
 *
 * <p>For more details, please refer to the ID3 specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2.3.0.txt">ID3 v2.3.0 Spec</a>
 * </ul>
 *
 * ID3V24:The 'Content type', which ID3v1 was stored as a one byte numeric
 * value only, is now a string. You may use one or several of the ID3v1
 * types as numerical strings, or, since the category list would be
 * impossible to maintain with accurate and up to date categories,
 * define your own. Example: "21" $00 "Eurodisco" $00
 *
 * You may also use any of the following keywords:
 * <p><table border=0 width="70%">
 * <tr><td>RX</td><td width="100%">Remix</td></tr>
 * <tr><td>CR</td><td>Cover</td></tr>
 * </table>
 *
 * @author : Paul Taylor
 * @author : Eric Farng
 * @version $Id$
 */
public class FrameBodyTCON extends AbstractFrameBodyTextInfo implements ID3v24FrameBody, ID3v23FrameBody
{
    /**
     * Creates a new FrameBodyTCON datatype.
     */
    public FrameBodyTCON()
    {
    }

    public FrameBodyTCON(FrameBodyTCON body)
    {
        super(body);
    }

    /**
     * Creates a new FrameBodyTCON datatype.
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTCON(byte textEncoding, String text)
    {
        super(textEncoding, text);
    }

    /**
     * Creates a new FrameBodyTCON datatype.
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTCON(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
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
        return ID3v24Frames.FRAME_ID_GENRE;
    }


    /**
     * Convert value to internal genre value
     *
     * @param value
     * @return
     */
    public static String convertGenericToID3v24Genre(String value)
    {
        try
        {
            //If passed id and known value use it
            int genreId = Integer.parseInt(value);
            if (genreId <= GenreTypes.getMaxGenreId())
            {
                return String.valueOf(genreId);
            }
            else
            {
                return value;
            }
        }
        catch (NumberFormatException nfe)
        {
            // If passed String, use matching integral value if can
            Integer genreId = GenreTypes.getInstanceOf().getIdForName(value);
            // to preserve iTunes compatibility, don't write genre ids higher than getMaxStandardGenreId, rather use string
            if (genreId != null && genreId <= GenreTypes.getMaxStandardGenreId())
            {
                return String.valueOf(genreId);
            }

            //Covert special string values
            if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.RX.getDescription()))
            {
                value = ID3V2ExtendedGenreTypes.RX.name();
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.CR.getDescription()))
            {
                value = ID3V2ExtendedGenreTypes.CR.name();
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.RX.name()))
            {
                value = ID3V2ExtendedGenreTypes.RX.name();
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.CR.name()))
            {
                value = ID3V2ExtendedGenreTypes.CR.name();
            }
        }
        return value;
    }

    /**
     * Convert value to internal genre value
     *
     * @param value
     * @return
     */
    public static String convertGenericToID3v23Genre(String value)
    {
        try
        {
            //If passed integer and in list use numeric form else use original value
            int genreId = Integer.parseInt(value);
            if (genreId <= GenreTypes.getMaxGenreId())
            {
                return bracketWrap(String.valueOf(genreId));
            }
            else
            {
                return value;
            }
        }
        catch (NumberFormatException nfe)
        {
            //if passed text try and find integral value otherwise use text
            Integer genreId = GenreTypes.getInstanceOf().getIdForName(value);
            // to preserve iTunes compatibility, don't write genre ids higher than getMaxStandardGenreId, rather use string
            if (genreId != null && genreId <= GenreTypes.getMaxStandardGenreId())
            {
                return bracketWrap(String.valueOf(genreId));
            }

            //But special handling for these text values
            if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.RX.getDescription()))
            {
                value = bracketWrap(ID3V2ExtendedGenreTypes.RX.name());
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.CR.getDescription()))
            {
                value = bracketWrap(ID3V2ExtendedGenreTypes.CR.name());
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.RX.name()))
            {
                value = bracketWrap(ID3V2ExtendedGenreTypes.RX.name());
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.CR.name()))
            {
                value = bracketWrap(ID3V2ExtendedGenreTypes.CR.name());
            }
        }
        return value;
    }

    public static String convertGenericToID3v22Genre(String value)
    {
        return convertGenericToID3v23Genre(value);
    }

    private static String bracketWrap(Object value)
    {
        return "(" + value + ')';
    }

    /**
     * Convert internal v24 genre value to generic genre
     *
     * @param value
     * @return
     */
    public static String convertID3v24GenreToGeneric(String value)
    {
        try
        {
            int genreId = Integer.parseInt(value);
            if (genreId <= GenreTypes.getMaxGenreId())
            {
                return GenreTypes.getInstanceOf().getValueForId(genreId);
            }
            else
            {
                return value;
            }
        }
        catch (NumberFormatException nfe)
        {
            if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.RX.name()))
            {
                value = ID3V2ExtendedGenreTypes.RX.getDescription();
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.CR.name()))
            {
                value = ID3V2ExtendedGenreTypes.CR.getDescription();
            }
            else
            {
                return value;
            }
        }
        return value;
    }

    private static String checkBracketed(String value)
    {
        value=value.replace("(", "");
        value=value.replace(")", "");
        try
        {
            int genreId = Integer.parseInt(value);
            if (genreId <= GenreTypes.getMaxGenreId()) {
                return GenreTypes.getInstanceOf().getValueForId(genreId);
            }
            else
            {
                return value;
            }
        }
        catch (NumberFormatException nfe)
        {
            if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.RX.name()))
            {
                value = ID3V2ExtendedGenreTypes.RX.getDescription();
            }
            else if (value.equalsIgnoreCase(ID3V2ExtendedGenreTypes.CR.name()))
            {
                value = ID3V2ExtendedGenreTypes.CR.getDescription();
            }
            else
            {
                return value;
            }
        }
        return value;
    }

    /**
     * Convert V23 format to Generic
     *
     * i.e.
     *
     * (2)         -> Country
     * (RX)        -> Remix
     * Shoegaze    -> Shoegaze
     * (2)Shoegaze -> Country Shoegaze
     *
     * Note only handles one field so if the frame stored (2)(3) this would be two separate fields
     * and would manifest itself as two different calls to this method once for (2) and once for (3)
     * @param value
     * @return
     */
    public static String convertID3v23GenreToGeneric(String value)
    {
        if(value.contains(")") && value.lastIndexOf(')')<value.length()-1)
        {
            return checkBracketed(value.substring(0,value.lastIndexOf(')'))) + ' ' + value.substring(value.lastIndexOf(')')+1);
        }
        else
        {
            return checkBracketed(value);
        }
    }

    public static String convertID3v22GenreToGeneric(String value)
    {
        return convertID3v23GenreToGeneric(value);
    }

    public void setV23Format()
    {
        TCONString text = (TCONString) getObject(DataTypes.OBJ_TEXT);
        text.setNullSeperateMultipleValues(false);
    }

    protected void setupObjectList()
    {
        objectList.add(new NumberHashMap(DataTypes.OBJ_TEXT_ENCODING, this, TextEncoding.TEXT_ENCODING_FIELD_SIZE));
        objectList.add(new TCONString(DataTypes.OBJ_TEXT, this));
    }


}
