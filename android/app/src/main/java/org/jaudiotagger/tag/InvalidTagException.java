/*
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
 */
package org.jaudiotagger.tag;

/**
 * An <code>InvalidTagException</code> is thrown if a parse error occurs while
 * a tag is being read from a file. This is different from a
 * <code>TagNotFoundException</code>. Each tag (or MP3 Frame Header) has an ID
 * string or some way saying that it simply exists. If this string is missing,
 * <code>TagNotFoundException</code> is thrown. If the ID string exists, then
 * any other error while reading throws an <code>InvalidTagException</code>.
 *
 * @version $Revision$
 */
public class InvalidTagException extends TagException
{
    /**
     * Creates a new InvalidTagException datatype.
     */
    public InvalidTagException()
    {
    }

    /**
     * Creates a new InvalidTagException datatype.
     *
     * @param ex the cause.
     */
    public InvalidTagException(Throwable ex)
    {
        super(ex);
    }

    /**
     * Creates a new InvalidTagException datatype.
     *
     * @param msg the detail message.
     */
    public InvalidTagException(String msg)
    {
        super(msg);
    }

    /**
     * Creates a new InvalidTagException datatype.
     *
     * @param msg the detail message.
     * @param ex  the cause.
     */
    public InvalidTagException(String msg, Throwable ex)
    {
        super(msg, ex);
    }
}