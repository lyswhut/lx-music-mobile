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
 */
package org.jaudiotagger.logging;


/*
 * For Formatting metadata contents of a file as simple text
*/
public class PlainTextTagDisplayFormatter extends AbstractTagDisplayFormatter
{
    private static PlainTextTagDisplayFormatter formatter;

    StringBuffer sb = new StringBuffer();
    StringBuffer indent = new StringBuffer();

    public PlainTextTagDisplayFormatter()
    {

    }

    public void openHeadingElement(String type, String value)
    {
        addElement(type, value);
        increaseLevel();
    }

    public void openHeadingElement(String type, boolean value)
    {
        openHeadingElement(type, String.valueOf(value));
    }

    public void openHeadingElement(String type, int value)
    {
        openHeadingElement(type, String.valueOf(value));
    }

    public void closeHeadingElement(String type)
    {
        decreaseLevel();
    }

    public void increaseLevel()
    {
        level++;
        indent.append("  ");
    }

    public void decreaseLevel()
    {
        level--;
        indent = new StringBuffer(indent.substring(0, indent.length() - 2));
    }

    public void addElement(String type, String value)
    {
        sb.append(indent).append(type).append(":").append(value).append('\n');
    }

    public void addElement(String type, int value)
    {
        addElement(type, String.valueOf(value));
    }

    public void addElement(String type, boolean value)
    {
        addElement(type, String.valueOf(value));
    }

    public String toString()
    {
        return sb.toString();
    }

    public static AbstractTagDisplayFormatter getInstanceOf()
    {
        if (formatter == null)
        {
            formatter = new PlainTextTagDisplayFormatter();
        }
        return formatter;
    }
}
