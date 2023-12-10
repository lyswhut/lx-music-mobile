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
 *  Description:
 * This class represents 'parts of tags'. It contains methods that they all use
 * use. ID3v2 tags have frames. Lyrics3 tags have fields. ID3v1 tags do not
 * have parts. It also contains their header while the body contains the
 * actual fragments.
 */
package org.jaudiotagger.tag.id3;

import org.jaudiotagger.utils.EqualsUtil;

/**
 * A frame contains meta-information of a particular type. A frame contains a header and a body
 */
public abstract class AbstractTagFrame extends AbstractTagItem
{

    /**
     * Actual data this fragment holds
     */
    protected AbstractTagFrameBody frameBody;

    public AbstractTagFrame()
    {
    }

    /**
     * This constructs the bodies copy constructor this in turn invokes
     * * bodies objectlist.
     * @param copyObject
     */
    public AbstractTagFrame(AbstractTagFrame copyObject)
    {
        this.frameBody = (AbstractTagFrameBody) ID3Tags.copyObject(copyObject.frameBody);
        this.frameBody.setHeader(this);
    }

    /**
     * Sets the body datatype for this fragment. The body datatype contains the
     * actual information for the fragment.
     *
     * @param frameBody the body datatype
     */
    public void setBody(AbstractTagFrameBody frameBody)
    {
        this.frameBody = frameBody;
        this.frameBody.setHeader(this);
    }

    /**
     * Returns the body datatype for this fragment. The body datatype contains the
     * actual information for the fragment.
     *
     * @return the body datatype
     */
    public AbstractTagFrameBody getBody()
    {
        return this.frameBody;
    }

    /**
     * Returns true if this datatype and it's body is a subset of the argument.
     * This datatype is a subset if the argument is the same class.
     *
     * @param obj datatype to determine if subset of
     * @return true if this datatype and it's body is a subset of the argument.
     */
    public boolean isSubsetOf(Object obj)
    {
        if (!(obj instanceof AbstractTagFrame))
        {
            return false;
        }

        if ((frameBody == null) && (((AbstractTagFrame) obj).frameBody == null))
        {
            return true;
        }

        if ((frameBody == null) || (((AbstractTagFrame) obj).frameBody == null))
        {
            return false;
        }

        return frameBody.isSubsetOf(((AbstractTagFrame) obj).frameBody) && super.isSubsetOf(obj);

    }

    /**
     * Returns true if this datatype and its body equals the argument and its
     * body. this datatype is equal if and only if they are the same class and
     * have the same <code>getSubId</code> id string.
     *
     * @param obj datatype to determine equality of
     * @return true if this datatype and its body equals the argument and its
     *         body.
     */
    public boolean equals(Object obj)
    {
        if ( this == obj ) return true;
        if (!(obj instanceof AbstractTagFrame))
        {
            return false;
        }

        AbstractTagFrame that = (AbstractTagFrame) obj;
        return
              EqualsUtil.areEqual(this.getIdentifier(), that.getIdentifier()) &&
              EqualsUtil.areEqual(this.frameBody, that.frameBody) &&
              super.equals(that);

    }

    @Override
    public String toString ()
    {
        return getBody ().toString ();
    }
}
