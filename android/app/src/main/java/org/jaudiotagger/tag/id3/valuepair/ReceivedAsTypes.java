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
 * You should have received a copy of the GNU Lesser General Public License ainteger with this library; if not,
 * you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 * Used by Commercial Frame (COMR)
 */
package org.jaudiotagger.tag.id3.valuepair;

import org.jaudiotagger.tag.datatype.AbstractIntStringValuePair;

/**
 * Defines how song was purchased used by the COMR frame
 * 
 */
public class ReceivedAsTypes extends AbstractIntStringValuePair
{
    //The number of bytes used to hold the text encoding field size
    public static final int RECEIVED_AS_FIELD_SIZE = 1;

    private static ReceivedAsTypes receivedAsTypes;

    public static ReceivedAsTypes getInstanceOf()
    {
        if (receivedAsTypes == null)
        {
            receivedAsTypes = new ReceivedAsTypes();
        }
        return receivedAsTypes;
    }

    private ReceivedAsTypes()
    {
        idToValue.put(0x00, "Other");
        idToValue.put(0x01, "Standard CD album with other songs");
        idToValue.put(0x02, "Compressed audio on CD");
        idToValue.put(0x03, "File over the Internet");
        idToValue.put(0x04, "Stream over the Internet");
        idToValue.put(0x05, "As note sheets");
        idToValue.put(0x06, "As note sheets in a book with other sheets");
        idToValue.put(0x07, "Music on other media");
        idToValue.put(0x08, "Non-musical merchandise");
        createMaps();
    }
}
