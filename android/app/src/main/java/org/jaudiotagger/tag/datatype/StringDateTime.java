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


/**
 * Represents a timestamp field
 */
public class StringDateTime extends StringSizeTerminated
{
    /**
     * Creates a new ObjectStringDateTime datatype.
     *
     * @param identifier
     * @param frameBody
     */
    public StringDateTime(String identifier, AbstractTagFrameBody frameBody)
    {
        super(identifier, frameBody);
    }

    public StringDateTime(StringDateTime object)
    {
        super(object);
    }

    /**
     * @param value
     */
    public void setValue(Object value)
    {
        if (value != null)
        {
            this.value = value.toString().replace(' ', 'T');
        }
    }

    /**
     * @return
     */
    public Object getValue()
    {
        if (value != null)
        {
            return value.toString().replace(' ', 'T');
        }
        else
        {
            return null;
        }
    }

    public boolean equals(Object obj)
    {
        return obj instanceof StringDateTime && super.equals(obj);

    }
}
