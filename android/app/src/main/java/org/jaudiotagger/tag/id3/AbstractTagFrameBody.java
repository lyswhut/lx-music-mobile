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
 *  FragmentBody contains the data for a fragment.
 * ID3v2 tags have frames bodys. Lyrics3 tags have fields bodys
 * ID3v1 tags do not have fragments bodys.
 * Fragment Bodies consist of a number of MP3Objects held in an objectList
 * Methods are additionally defined here to restrieve and set these objects.
 * We also specify methods for getting/setting the text encoding of textual
 * data.
 * Fragment bodies should not be concerned about their parent fragment. For
 * example most ID3v2 frames can be applied to ID3v2tags of different versions.
 * The frame header will need modification based on the frame version but this
 * should have no effect on the frame body.
 */
package org.jaudiotagger.tag.id3;

import org.jaudiotagger.tag.datatype.AbstractDataType;
import org.jaudiotagger.tag.datatype.DataTypes;
import org.jaudiotagger.tag.id3.valuepair.TextEncoding;

import java.util.ArrayList;
import java.util.Iterator;

/**
 * A frame body contains the data content for a frame
 */
public abstract class AbstractTagFrameBody extends AbstractTagItem
{
    public void createStructure()
    {
    }

    /**
     * Reference to the header associated with this frame body, a framebody can be created without a header
     * but one it is associated with a header this should be set. It is principally useful for the framebody to know
     * its header, because this will specify its tag version and some framebodies behave slighly different
     * between tag versions.
     */
    private AbstractTagFrame header;

    /**
     * List of data types that make up this particular frame body.
     */
    protected ArrayList<AbstractDataType> objectList = new ArrayList<AbstractDataType>();

    /**
     * Return the Text Encoding
     *
     * @return the text encoding used by this framebody
     */
    public final byte getTextEncoding()
    {
        AbstractDataType o = getObject(DataTypes.OBJ_TEXT_ENCODING);

        if (o != null)
        {
            Long encoding = (Long) (o.getValue());
            return encoding.byteValue();
        }
        else
        {
            return TextEncoding.ISO_8859_1;
        }
    }

    /**
     * Set the Text Encoding to use for this frame body
     *
     * @param textEncoding to use for this frame body
     */
    public final void setTextEncoding(byte textEncoding)
    {
        //Number HashMap actually converts this byte to a long
        setObjectValue(DataTypes.OBJ_TEXT_ENCODING, textEncoding);
    }


    /**
     * Creates a new framebody, at this point the bodys
     * ObjectList is setup which defines what datatypes are expected in body
     */
    protected AbstractTagFrameBody()
    {
        setupObjectList();
    }

    /**
     * Copy Constructor for fragment body. Copies all objects in the
     * Object Iterator with data.
     * @param copyObject
     */
    protected AbstractTagFrameBody(AbstractTagFrameBody copyObject)
    {
        AbstractDataType newObject;
        for (int i = 0; i < copyObject.objectList.size(); i++)
        {
            newObject = (AbstractDataType) ID3Tags.copyObject(copyObject.objectList.get(i));
            newObject.setBody(this);
            this.objectList.add(newObject);
        }
    }


    /**
     *
     * @return the text value that the user would expect to see for this framebody type, this should be overridden
     * for all frame-bodies
     */
    public String getUserFriendlyValue()
    {
        return toString();
    }

    /**
     * This method calls <code>toString</code> for all it's objects and appends
     * them without any newline characters.
     *
     * @return brief description string
     */
    public String getBriefDescription()
    {
        String str = "";
        for (AbstractDataType object : objectList)
        {
            if ((object.toString() != null) && (object.toString().length() > 0))
            {
                str += (object.getIdentifier() + "=\"" + object.toString() + "\"; ");
            }
        }
        return str;
    }


    /**
     * This method calls <code>toString</code> for all it's objects and appends
     * them. It contains new line characters and is more suited for display
     * purposes
     *
     * @return formatted description string
     */
    public final String getLongDescription()
    {
        String str = "";
        for (AbstractDataType object : objectList)
        {
            if ((object.toString() != null) && (object.toString().length() > 0))
            {
                str += (object.getIdentifier() + " = " + object.toString() + "\n");
            }
        }
        return str;
    }

    /**
     * Sets all objects of identifier type to value defined by <code>obj</code> argument.
     *
     * @param identifier <code>MP3Object</code> identifier
     * @param value      new datatype value
     */
    public final void setObjectValue(String identifier, Object value)
    {
        AbstractDataType object;
        Iterator<AbstractDataType> iterator = objectList.listIterator();
        while (iterator.hasNext())
        {
            object = iterator.next();
            if (object.getIdentifier().equals(identifier))
            {
                object.setValue(value);
            }
        }
    }

    /**
     * Returns the value of the datatype with the specified
     * <code>identifier</code>
     *
     * @param identifier
     * @return the value of the dattype with the specified
     *         <code>identifier</code>
     */
    public final Object getObjectValue(String identifier)
    {
        return getObject(identifier).getValue();
    }

    /**
     * Returns the datatype with the specified
     * <code>identifier</code>
     *
     * @param identifier
     * @return the datatype with the specified
     *         <code>identifier</code>
     */
    public final AbstractDataType getObject(String identifier)
    {
        AbstractDataType object;
        Iterator<AbstractDataType> iterator = objectList.listIterator();
        while (iterator.hasNext())
        {
            object = iterator.next();
            if (object.getIdentifier().equals(identifier))
            {
                return object;
            }
        }
        return null;
    }

    /**
     * Returns the size in bytes of this fragmentbody
     *
     * @return estimated size in bytes of this datatype
     */
    public int getSize()
    {
        int size = 0;
        AbstractDataType object;
        Iterator<AbstractDataType> iterator = objectList.listIterator();
        while (iterator.hasNext())
        {
            object = iterator.next();
            size += object.getSize();
        }
        return size;
    }

    /**
     * Returns true if this instance and its entire DataType
     * array list is a subset of the argument. This class is a subset if it is
     * the same class as the argument.
     *
     * @param obj datatype to determine subset of
     * @return true if this instance and its entire datatype array list is a
     *         subset of the argument.
     */
    public boolean isSubsetOf(Object obj)
    {
        if (!(obj instanceof AbstractTagFrameBody))
        {
            return false;
        }
        ArrayList<AbstractDataType> superset = ((AbstractTagFrameBody) obj).objectList;
        for (AbstractDataType anObjectList : objectList)
        {
            if (anObjectList.getValue() != null)
            {
                if (!superset.contains(anObjectList))
                {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Returns true if this datatype and its entire DataType array
     * list equals the argument. This datatype is equal to the argument if they
     * are the same class.
     *
     * @param obj datatype to determine equality of
     * @return true if this datatype and its entire <code>MP3Object</code> array
     *         list equals the argument.
     */
    public boolean equals(Object obj)
    {
        if (!(obj instanceof AbstractTagFrameBody))
        {
            return false;
        }
        AbstractTagFrameBody object = (AbstractTagFrameBody) obj;
        boolean check =this.objectList.equals(object.objectList) && super.equals(obj);
        return check;
    }

    /**
     * Returns an iterator of the DataType list.
     *
     * @return iterator of the DataType list.
     */
    public Iterator iterator()
    {
        return objectList.iterator();
    }


    /**
     * Return brief description of FrameBody
     *
     * @return brief description of FrameBody
     */
    public String toString()
    {
        return getBriefDescription();
    }


    /**
     * Create the list of Datatypes that this body
     * expects in the correct order This method needs to be implemented by concrete subclasses
     */
    protected abstract void setupObjectList();

    /**
     * Get Reference to header
     *
     * @return
     */
    public AbstractTagFrame getHeader()
    {
        return header;
    }

    /**
     * Set header
     *
     * @param header
     */
    public void setHeader(AbstractTagFrame header)
    {
        this.header = header;
    }
}
