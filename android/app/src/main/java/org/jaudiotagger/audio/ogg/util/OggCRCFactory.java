/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.audio.ogg.util;

import java.util.logging.Logger;


/**
 * OffCRC Calculations
 *
 * $Id$
 *
 * @author Raphael Slinckx (KiKiDonK)
 * @version 19 d�cembre 2003
 */
public class OggCRCFactory
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.ogg");

    private static long[] crc_lookup = new long[256];
    private static boolean init = false;


    public static void init()
    {
        for (int i = 0; i < 256; i++)
        {
            long r = i << 24;

            for (int j = 0; j < 8; j++)
            {
                if ((r & 0x80000000L) != 0)
                {
                    r = (r << 1) ^ 0x04c11db7L;
                }
                else
                {
                    r <<= 1;
                }
            }

            crc_lookup[i] = (r);
        }
        init = true;
    }


    public boolean checkCRC(byte[] data, byte[] crc)
    {
        return new String(crc).equals(new String(computeCRC(data)));
    }

    public static byte[] computeCRC(byte[] data)
    {

        if (!init)
        {
            init();
        }

        long crc_reg = 0;

        for (byte aData : data)
        {
            int tmp = (int) (((crc_reg >>> 24) & 0xff) ^ u(aData));

            crc_reg = (crc_reg << 8) ^ crc_lookup[tmp];
            crc_reg &= 0xffffffff;
        }

        byte[] sum = new byte[4];

        sum[0] = (byte) (crc_reg & 0xffL);
        sum[1] = (byte) ((crc_reg >>> 8) & 0xffL);
        sum[2] = (byte) ((crc_reg >>> 16) & 0xffL);
        sum[3] = (byte) ((crc_reg >>> 24) & 0xffL);

        return sum;
    }


    private static int u(int n)
    {
        return n & 0xff;
    }
}

