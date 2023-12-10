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
package org.jaudiotagger.tag.id3.framebody;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.id3.ID3v23Frames;
import org.jaudiotagger.tag.id3.ID3v24Frames;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.nio.ByteBuffer;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;


public class FrameBodyTDRC extends AbstractFrameBodyTextInfo implements ID3v24FrameBody
{
    /**
     * Used when converting from v3 tags , these fields should ALWAYS hold the v23 value
     */
    private String originalID;
    private String year = "";
    private String time = "";
    private String date = "";
    private boolean monthOnly = false;
    private boolean hoursOnly = false;

    private static SimpleDateFormat formatYearIn, formatYearOut;
    private static SimpleDateFormat formatDateIn, formatDateOut, formatMonthOut;
    private static SimpleDateFormat formatTimeIn, formatTimeOut, formatHoursOut;

    private static final List<SimpleDateFormat> formatters = new ArrayList<SimpleDateFormat>();

    private static final int PRECISION_SECOND = 0;
    private static final int PRECISION_MINUTE = 1;
    private static final int PRECISION_HOUR = 2;
    private static final int PRECISION_DAY = 3;
    private static final int PRECISION_MONTH = 4;
    private static final int PRECISION_YEAR = 5;

    static
    {
        //This is allowable v24 format , we use UK Locale not because we are restricting to UK
        //but because these formats are fixed in ID3 spec, and could possibly get unexpected results if library
        //used with a default locale that has Date Format Symbols that interfere with the pattern
        formatters.add(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.UK));
        formatters.add(new SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.UK));
        formatters.add(new SimpleDateFormat("yyyy-MM-dd'T'HH", Locale.UK));
        formatters.add(new SimpleDateFormat("yyyy-MM-dd", Locale.UK));
        formatters.add(new SimpleDateFormat("yyyy-MM", Locale.UK));
        formatters.add(new SimpleDateFormat("yyyy", Locale.UK));

        //These are formats used by v23 Frames
        formatYearIn = new SimpleDateFormat("yyyy", Locale.UK);
        formatDateIn = new SimpleDateFormat("ddMM", Locale.UK);
        formatTimeIn = new SimpleDateFormat("HHmm", Locale.UK);

        //These are the separate components of the v24 format that the v23 formats map to
        formatYearOut = new SimpleDateFormat("yyyy", Locale.UK);
        formatDateOut = new SimpleDateFormat("-MM-dd", Locale.UK);
        formatMonthOut = new SimpleDateFormat("-MM", Locale.UK);
        formatTimeOut = new SimpleDateFormat("'T'HH:mm", Locale.UK);
        formatHoursOut = new SimpleDateFormat("'T'HH", Locale.UK);

    }

    /**
     * Creates a new FrameBodyTDRC datatype.
     */
    public FrameBodyTDRC()
    {
        super();
    }

    public FrameBodyTDRC(FrameBodyTDRC body)
    {
        super(body);
    }

    /**
     * Retrieve the original identifier
     * @return
     */
    public String getOriginalID()
    {
        return originalID;
    }

    /**
     * When this has been generated as an amalgamation of v3 frames assumes
     * the v3 frames match the the format in specification and convert them
     * to their equivalent v4 format and return the generated String.
     * i.e if the v3 frames contain a valid value this will return a valid
     * v4 value, if not this won't.
     */

    /**
     * Synchronized because SimpleDatFormat aren't thread safe
     *
     * @param formatDate
     * @param parseDate
     * @param text
     * @return
     */
    private static synchronized String formatAndParse(SimpleDateFormat formatDate,SimpleDateFormat parseDate,String text)
    {
        try
        {
            Date date = parseDate.parse(text);
            String result = formatDate.format(date);
            return result;
        }
        catch (ParseException e)
        {
            logger.warning("Unable to parse:" + text);
        }
        return "";
    }

    public String getFormattedText()
    {
        StringBuffer sb = new StringBuffer();
        if (originalID == null)
        {
            return this.getText();
        }
        else
        {
            if (year != null && !(year.trim().isEmpty()))
            {
               sb.append(formatAndParse(formatYearOut,formatYearIn,year));
            }
            if (!date.equals(""))
            {
                if(isMonthOnly())
                {
                    sb.append(formatAndParse(formatMonthOut,formatDateIn,date));    
                }
                else
                {
                    sb.append(formatAndParse(formatDateOut,formatDateIn,date));
                }
            }
            if (!time.equals(""))
            {
                if(isHoursOnly())
                {
                    sb.append(formatAndParse(formatHoursOut,formatTimeIn,time));
                }
                else
                {
                    sb.append(formatAndParse(formatTimeOut,formatTimeIn,time));
                }

            }
            return sb.toString();
        }
    }

    public void setYear(String year)
    {
        logger.finest("Setting year to" + year);
        this.year = year;
    }

    public void setTime(String time)
    {
        logger.finest("Setting time to:" + time);
        this.time = time;
    }


    public void setDate(String date)
    {
        logger.finest("Setting date to:" + date);
        this.date = date;
    }

    public String getYear()
    {
        return year;
    }

    public String getTime()
    {
        return time;
    }

    public String getDate()
    {
        return date;
    }

    /**
     * When converting v3 TYER to v4 TDRC frame
     * @param body
     */
    public FrameBodyTDRC(FrameBodyTYER body)
    {
        originalID = ID3v23Frames.FRAME_ID_V3_TYER;
        year = body.getText();
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_TEXT, getFormattedText());
    }

    /**
     * When converting v3 TIME to v4 TDRC frame
     * @param body
     */
    public FrameBodyTDRC(FrameBodyTIME body)
    {
        originalID = ID3v23Frames.FRAME_ID_V3_TIME;
        time = body.getText();
        setHoursOnly(body.isHoursOnly());
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_TEXT,  getFormattedText());
    }

    /**
     * When converting v3 TDAT to v4 TDRC frame
     * @param body
     */
    public FrameBodyTDRC(FrameBodyTDAT body)
    {
        originalID = ID3v23Frames.FRAME_ID_V3_TDAT;
        date = body.getText();
        setMonthOnly(body.isMonthOnly());
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_TEXT, getFormattedText());
    }

    /**
     * When converting v3 TDRA to v4 TDRC frame
     * @param body
     */
    public FrameBodyTDRC(FrameBodyTRDA body)
    {
        originalID = ID3v23Frames.FRAME_ID_V3_TRDA;
        date = body.getText();
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, TextEncoding.ISO_8859_1);
        setObjectValue(DataTypes.OBJ_TEXT, getFormattedText());
    }
    /**
     * Creates a new FrameBodyTDRC dataType.
     *
     * Tries to decode the text to find the v24 date mask being used, and store the v3 components of the mask
     *
     * @param textEncoding
     * @param text
     */
    public FrameBodyTDRC(byte textEncoding, String text)
    {
        super(textEncoding, text);
        findMatchingMaskAndExtractV3Values();
    }

     /**
     * Creates a new FrameBodyTDRC datatype from File
     *
     * @param byteBuffer
     * @param frameSize
     * @throws InvalidTagException
     */
    public FrameBodyTDRC(ByteBuffer byteBuffer, int frameSize) throws InvalidTagException
    {
        super(byteBuffer, frameSize);
        findMatchingMaskAndExtractV3Values();
    }

    public void findMatchingMaskAndExtractV3Values()
    {
        //Find the date format of the text
        for (int i = 0; i < formatters.size(); i++)
        {
            try
            {
                Date d;
                synchronized(formatters.get(i))
                {
                    d = formatters.get(i).parse(getText());
                }
                //If able to parse a date from the text
                if (d != null)
                {
                    extractID3v23Formats(d, i);
                    break;
                }
            }
            //Dont display will occur for each failed format
            catch (ParseException e)
            {
                //Do nothing;
            }
            catch(NumberFormatException nfe)
            {
                //Do nothing except log warning because not really expecting this to happen
                logger.log(Level.WARNING,"Date Formatter:"+formatters.get(i).toPattern() + "failed to parse:"+getText()+ "with "+nfe.getMessage(),nfe);
            }
        }
    }

    /**
     * Format Date
     *
     * Synchronized because SimpleDateFormat is invalid
     *
     * @param d
     * @return
     */
    private static synchronized String formatDateAsYear(Date d)
    {
        return formatYearIn.format(d);
    }

      /**
     * Format Date
     *
     * Synchronized because SimpleDateFormat is invalid
     *
     * @param d
     * @return
     */
    private static synchronized String formatDateAsDate(Date d)
    {
        return formatDateIn.format(d);
    }

      /**
     * Format Date
     *
     * Synchronized because SimpleDateFormat is invalid
     *
     * @param d
     * @return
     */
    private static synchronized String formatDateAsTime(Date d)
    {
        return formatTimeIn.format(d);
    }

    /**
     * Extract the components ans store the v23 version of the various values
     *
     * @param dateRecord
     * @param precision
     */
    //TODO currently if user has entered Year and Month, we only store in v23, should we store month with 
    //first day
    private void extractID3v23Formats(final Date dateRecord, final int precision)
    {
        logger.fine("Precision is:"+precision+"for date:"+dateRecord.toString());
        Date d = dateRecord;

        //Precision Year
        if (precision == PRECISION_YEAR)
        {
            setYear(formatDateAsYear(d));
        }
        //Precision Month
        else if (precision == PRECISION_MONTH)
        {
            setYear(formatDateAsYear(d));
            setDate(formatDateAsDate(d));
            monthOnly=true;
        }
        //Precision Day
        else if (precision == PRECISION_DAY)
        {
            setYear(formatDateAsYear(d));
            setDate(formatDateAsDate(d));
        }
        //Precision Hour
        else if (precision == PRECISION_HOUR)
        {
            setYear(formatDateAsYear(d));
            setDate(formatDateAsDate(d));
            setTime(formatDateAsTime(d));
            hoursOnly =true;

        }
        //Precision Minute
        else if (precision == PRECISION_MINUTE)
        {
            setYear(formatDateAsYear(d));
            setDate(formatDateAsDate(d));
            setTime(formatDateAsTime(d));
        }
        //Precision Minute
        else if (precision == PRECISION_SECOND)
        {
            setYear(formatDateAsYear(d));
            setDate(formatDateAsDate(d));
            setTime(formatDateAsTime(d));
        }
    }

    /**
     * The ID3v2 frame identifier
     *
     * @return the ID3v2 frame identifier  for this frame type
     */
    public String getIdentifier()
    {
        return ID3v24Frames.FRAME_ID_YEAR;
    }

    public boolean isMonthOnly()
    {
        return monthOnly;
    }

    public void setMonthOnly(boolean monthOnly)
    {
        this.monthOnly = monthOnly;
    }

    public boolean isHoursOnly()
    {
        return hoursOnly;
    }

    public void setHoursOnly(boolean hoursOnly)
    {
        this.hoursOnly = hoursOnly;
    }
}
