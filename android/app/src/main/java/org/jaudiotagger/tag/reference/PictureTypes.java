/**
 * @author : Paul Taylor
 *
 * Version @version:$Id$
 *
 * Jaudiotagger Copyright (C)2004,2005
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 * or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 * you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 * Valid Picture Types in ID3
 */
package org.jaudiotagger.tag.reference;

import org.jaudiotagger.tag.datatype.AbstractIntStringValuePair;

/**
 * Pictures types for Attached Pictures
 *
 * <P>Note this list is used by APIC and PIC frames within ID3v2. It is also used by Flac format Picture blocks
 * and WMA Picture fields.
 */
public class PictureTypes extends AbstractIntStringValuePair
{
    private static PictureTypes pictureTypes;

    public static PictureTypes getInstanceOf()
    {
        if (pictureTypes == null)
        {
            pictureTypes = new PictureTypes();
        }
        return pictureTypes;
    }

    public static final int PICTURE_TYPE_FIELD_SIZE = 1;
    public static final String DEFAULT_VALUE = "Cover (front)";
    public static final Integer DEFAULT_ID = 3;

    private PictureTypes()
    {
        idToValue.put(0, "Other");
        idToValue.put(1, "32x32 pixels 'file icon' (PNG only)");
        idToValue.put(2, "Other file icon");
        idToValue.put(3, "Cover (front)");
        idToValue.put(4, "Cover (back)");
        idToValue.put(5, "Leaflet page");
        idToValue.put(6, "Media (e.g. label side of CD)");
        idToValue.put(7, "Lead artist/lead performer/soloist");
        idToValue.put(8, "Artist/performer");
        idToValue.put(9, "Conductor");
        idToValue.put(10, "Band/Orchestra");
        idToValue.put(11, "Composer");
        idToValue.put(12, "Lyricist/text writer");
        idToValue.put(13, "Recording Location");
        idToValue.put(14, "During recording");
        idToValue.put(15, "During performance");
        idToValue.put(16, "Movie/video screen capture");
        idToValue.put(17, "A bright coloured fish");
        idToValue.put(18, "Illustration");
        idToValue.put(19, "Band/artist logotype");
        idToValue.put(20, "Publisher/Studio logotype");

        createMaps();
    }

}
