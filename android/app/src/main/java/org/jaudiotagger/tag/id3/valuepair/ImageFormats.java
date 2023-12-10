/**
 *  @author : Paul Taylor
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
 * This class maps from v2.2 Image formats (PIC) to v2.3/v2.4 Mimetypes (APIC) and
 *  vice versa.
 */
package org.jaudiotagger.tag.id3.valuepair;

import java.util.HashMap;
import java.util.Map;

/**
 * Represents common image formats support by ID3 and provides a mapping between the format field supported in ID3v22 and the
 * mimetype field supported by ID3v23/ID3v24.                                                                                                                                    coverImage.getImageData()
 *
 *
 * Note only JPG and PNG are mentioned specifically in the ID3 v22 Spec but it only says 'Image Format is preferably
 * PNG or JPG' , not mandatory. In the jaudiotagger library we also consider GIF as a portable format, and we recognise
 * BMP,PDF and TIFF but do not consider these formats as portable.
 *
 */
//TODO identifying PICT, bit more difficult because in certain formats has an empty 512byte header
public class  ImageFormats
{
    public static final String V22_JPG_FORMAT = "JPG";
    public static final String V22_PNG_FORMAT = "PNG";
    public static final String V22_GIF_FORMAT = "GIF";
    public static final String V22_BMP_FORMAT = "BMP";
    public static final String V22_TIF_FORMAT = "TIF";
    public static final String V22_PDF_FORMAT = "PDF";
    public static final String V22_PIC_FORMAT = "PIC";


    public static final String MIME_TYPE_JPEG = "image/jpeg";
    public static final String MIME_TYPE_PNG  = "image/png";
    public static final String MIME_TYPE_GIF  = "image/gif";
    public static final String MIME_TYPE_BMP  = "image/bmp";
    public static final String MIME_TYPE_TIFF = "image/tiff";
    public static final String MIME_TYPE_PDF  = "image/pdf";
    public static final String MIME_TYPE_PICT = "image/x-pict";

    /**
     * Sometimes this is used for jpg instead :or have I made this up
     */
    public static final String MIME_TYPE_JPG  = "image/jpg";

    private static Map<String, String> imageFormatsToMimeType = new HashMap<String, String>();
    private static Map<String, String> imageMimeTypeToFormat = new HashMap <String, String>();

    static
    {
        imageFormatsToMimeType.put(V22_JPG_FORMAT, MIME_TYPE_JPEG);
        imageFormatsToMimeType.put(V22_PNG_FORMAT, MIME_TYPE_PNG);
        imageFormatsToMimeType.put(V22_GIF_FORMAT, MIME_TYPE_GIF);
        imageFormatsToMimeType.put(V22_BMP_FORMAT, MIME_TYPE_BMP);
        imageFormatsToMimeType.put(V22_TIF_FORMAT, MIME_TYPE_TIFF);
        imageFormatsToMimeType.put(V22_PDF_FORMAT, MIME_TYPE_PDF);
        imageFormatsToMimeType.put(V22_PIC_FORMAT, MIME_TYPE_PICT);

        String value;
        for (String key : imageFormatsToMimeType.keySet())
        {
            value = imageFormatsToMimeType.get(key);
            imageMimeTypeToFormat.put(value, key);
        }

        //The mapping isn't one-one lets add other mimetypes
        imageMimeTypeToFormat.put(MIME_TYPE_JPG, V22_JPG_FORMAT);
    }

    /**
     * Get v2.3 mimetype from v2.2 format
     * @param format
     * @return
     */
    public static String getMimeTypeForFormat(String format)
    {
        return imageFormatsToMimeType.get(format);
    }

    /**
     * Get v2.2 format from v2.3 mimetype
     * @param mimeType
     * @return
     */
    public static String getFormatForMimeType(String mimeType)
    {
        return imageMimeTypeToFormat.get(mimeType);
    }

    /**
     * Is this binary data a png image
     *
     * @param data
     * @return true if binary data matches expected header for a png
     */
    public static boolean binaryDataIsPngFormat(byte[] data)
    {
        //Read signature
        if(data.length<4)
        {
            return false;
        }
        return (0x89 == (data[0] & 0xff)) && (0x50 == (data[1] & 0xff)) && (0x4E == (data[2] & 0xff)) && (0x47 == (data[3] & 0xff));
    }

    /**
     * Is this binary data a jpg image
     *
     * @param data
     * @return true if binary data matches expected header for a jpg
     *
     * Some details http://www.obrador.com/essentialjpeg/headerinfo.htm
     */
    public static boolean binaryDataIsJpgFormat(byte[] data)
    {
        if(data.length<4)
        {
            return false;
        }
        //Read signature
        //Can be Can be FF D8 FF DB (samsung) , FF D8 FF E0 (standard) or FF D8 FF E1 or some other formats
        //see http://www.garykessler.net/library/file_sigs.html
        //FF D8 is SOI Marker, FFE0 or FFE1 is JFIF Marker
        return (0xff == (data[0] & 0xff)) && (0xd8 == (data[1] & 0xff)) && (0xff == (data[2] & 0xff)) && (0xdb <= (data[3] & 0xff));
    }

    /**
     * Is this binary data a gif image
     *
     * @param data
     * @return true if binary data matches expected header for a gif
     */
    public static boolean binaryDataIsGifFormat(byte[] data)
    {
        if(data.length<3)
        {
            return false;
        }
        //Read signature
        return (0x47 == (data[0] & 0xff)) && (0x49 == (data[1] & 0xff)) && (0x46 == (data[2] & 0xff));
    }

    /**
     *
     * Is this binary data a bmp image
     *
     * @param data
     * @return true if binary data matches expected header for a bmp
     */
    public static boolean binaryDataIsBmpFormat(byte[] data)
    {
        if(data.length<2)
        {
            return false;
        }
        //Read signature
        return (0x42 == (data[0] & 0xff)) && (0x4d == (data[1] & 0xff));
    }

    /**
     * Is this binary data a pdf image
     *
     * Details at http://en.wikipedia.org/wiki/Magic_number_%28programming%29
     *
     * @param data
     * @return true if binary data matches expected header for a pdf
     */
    public static boolean binaryDataIsPdfFormat(byte[] data)
    {
        if(data.length<4)
        {
            return false;
        }
        //Read signature
        return (0x25 == (data[0] & 0xff)) && (0x50 == (data[1] & 0xff)) && (0x44 == (data[2] & 0xff)) && (0x46 == (data[3] & 0xff));
    }

    /**
     * is this binary data a tiff image
     *
     * Details at http://en.wikipedia.org/wiki/Magic_number_%28programming%29
     * @param data
     * @return true if binary data matches expected header for a tiff
     */
    public static boolean binaryDataIsTiffFormat(byte[] data)
    {
        if(data.length<4)
        {
            return false;
        }
        //Read signature Intel
        return (
                ((0x49 == (data[0] & 0xff)) && (0x49 == (data[1] & 0xff)) && (0x2a == (data[2] & 0xff)) && (0x00 == (data[3] & 0xff)))
                ||
                ((0x4d == (data[0] & 0xff)) && (0x4d == (data[1] & 0xff)) && (0x00 == (data[2] & 0xff)) && (0x2a == (data[3] & 0xff)))
                );
    }

    /**
     *
     * @param data
     * @return true if the image format is a portable format recognised across operating systems
     */
    public static boolean isPortableFormat(byte[] data)
    {
        return binaryDataIsPngFormat(data) ||  binaryDataIsJpgFormat(data) ||  binaryDataIsGifFormat(data);     
    }

    /**
     *
     * @param data
     * @return correct mimetype for the image data represented by this byte data
     */
    public static String getMimeTypeForBinarySignature(byte[] data)
    {
        if(binaryDataIsPngFormat(data))
        {
            return MIME_TYPE_PNG;
        }
        else if(binaryDataIsJpgFormat(data))
        {
            return MIME_TYPE_JPEG;
        }
        else if(binaryDataIsGifFormat(data))
        {
            return MIME_TYPE_GIF;
        }
        else if(binaryDataIsBmpFormat(data))
        {
            return MIME_TYPE_BMP;
        }
        else if(binaryDataIsPdfFormat(data))
        {
            return MIME_TYPE_PDF;
        }
        else if(binaryDataIsTiffFormat(data))
        {
            return MIME_TYPE_TIFF;
        }
        else
        {
            return null;
        }
    }
}
