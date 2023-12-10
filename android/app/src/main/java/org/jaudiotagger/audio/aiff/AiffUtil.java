package org.jaudiotagger.audio.aiff;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

/**
 * Utility methods only of use for Aiff datatypes
 */
public class AiffUtil
{

    private final static SimpleDateFormat dateFmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ");


    public static double read80BitDouble(ByteBuffer chunkData) throws IOException
    {
        byte[] buf = new byte[10];
        chunkData.get(buf);
        ExtDouble xd = new ExtDouble(buf);
        return xd.toDouble();
    }

    /**
     * Converts a Macintosh-style timestamp (seconds since
     * January 1, 1904) into a Java date.  The timestamp is
     * treated as a time in the default localization.
     * Depending on that localization,
     * there may be some variation in the exact hour of the date
     * returned, e.g., due to daylight savings time.
     */
    public static Date timestampToDate(long timestamp)
    {
        Calendar cal = Calendar.getInstance();
        cal.set(1904, 0, 1, 0, 0, 0);

        // If we add the seconds directly, we'll truncate the long
        // value when converting to int.  So convert to hours plus
        // residual seconds.
        int hours = (int) (timestamp / 3600);
        int seconds = (int) (timestamp - (long) hours * 3600L);
        cal.add(Calendar.HOUR_OF_DAY, hours);
        cal.add(Calendar.SECOND, seconds);
        Date dat = cal.getTime();
        return dat;
    }

    /**
     * Format a date as text
     */
    public static String formatDate(Date dat)
    {
        return dateFmt.format(dat);
    }


}
