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
package org.jaudiotagger.tag.datatype;

import org.jaudiotagger.tag.id3.AbstractTagFrameBody;

import java.nio.charset.Charset;

import static org.jaudiotagger.StandardCharsets.ISO_8859_1;

/**
 * Represents a String whose size is determined by finding of a null character at the end of the String with fixed text encoding.
 *
 * The String will be encoded using the default encoding regardless of what encoding may be specified in the framebody
 */
public class StringNullTerminated extends TextEncodedStringNullTerminated
{
    /**
     * Creates a new ObjectStringNullTerminated datatype.
     *
     * @param identifier identifies the frame type
     * @param frameBody
     */
    public StringNullTerminated(String identifier, AbstractTagFrameBody frameBody)
    {
        super(identifier, frameBody);
    }

    public StringNullTerminated(StringNullTerminated object)
    {
        super(object);
    }

    public boolean equals(Object obj)
    {
        return obj instanceof StringNullTerminated && super.equals(obj);
    }

    protected Charset getTextEncodingCharSet()
    {
        return ISO_8859_1;
    }
}
