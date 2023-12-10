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
 */
package org.jaudiotagger.tag.lyrics3;

import org.jaudiotagger.tag.InvalidTagException;
import org.jaudiotagger.tag.datatype.StringSizeTerminated;

import java.nio.ByteBuffer;


public class FieldFrameBodyETT extends AbstractLyrics3v2FieldFrameBody
{
    /**
     * Creates a new FieldBodyETT datatype.
     */
    public FieldFrameBodyETT()
    {
        //        this.setObject("Title", "");
    }

    public FieldFrameBodyETT(FieldFrameBodyETT body)
    {
        super(body);
    }

    /**
     * Creates a new FieldBodyETT datatype.
     *
     * @param title
     */
    public FieldFrameBodyETT(String title)
    {
        this.setObjectValue("Title", title);
    }

    /**
     * Creates a new FieldBodyETT datatype.
     *
     * @param byteBuffer
     * @throws InvalidTagException
     */
    public FieldFrameBodyETT(ByteBuffer byteBuffer) throws InvalidTagException
    {
        this.read(byteBuffer);
    }

    /**
     * @return
     */
    public String getIdentifier()
    {
        return "ETT";
    }

    /**
     * @param title
     */
    public void setTitle(String title)
    {
        setObjectValue("Title", title);
    }

    /**
     * @return
     */
    public String getTitle()
    {
        return (String) getObjectValue("Title");
    }

    /**
     *
     */
    protected void setupObjectList()
    {
        objectList.add(new StringSizeTerminated("Title", this));
    }
}
