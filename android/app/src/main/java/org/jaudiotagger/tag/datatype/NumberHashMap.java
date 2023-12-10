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

import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.InvalidDataTypeException;
import org.jaudiotagger.tag.id3.AbstractTagFrameBody;
import org.jaudiotagger.tag.id3.valuepair.*;
import org.jaudiotagger.tag.reference.GenreTypes;
import org.jaudiotagger.tag.reference.PictureTypes;
import org.jaudiotagger.utils.EqualsUtil;

import java.util.Iterator;
import java.util.Map;
import java.util.TreeSet;

/**
 * Represents a number thats acts as a key into an enumeration of values
 */
public class NumberHashMap extends NumberFixedLength implements HashMapInterface<Integer, String>
{

    /**
     * key to value map
     */
    private Map<Integer, String> keyToValue = null;

    /**
     * value to key map
     */
    private Map<String, Integer> valueToKey = null;

    /**
     *
     */
    private boolean hasEmptyValue = false;


    /**
     * Creates a new ObjectNumberHashMap datatype.
     *
     * @param identifier
     * @param frameBody
     * @param size
     * @throws IllegalArgumentException
     */
    public NumberHashMap(String identifier, AbstractTagFrameBody frameBody, int size)
    {
        super(identifier, frameBody, size);

        if (identifier.equals(DataTypes.OBJ_GENRE))
        {
            valueToKey = GenreTypes.getInstanceOf().getValueToIdMap();
            keyToValue = GenreTypes.getInstanceOf().getIdToValueMap();

            //genres can be an id or literal value
            hasEmptyValue = true;
        }
        else if (identifier.equals(DataTypes.OBJ_TEXT_ENCODING))
        {
            valueToKey = TextEncoding.getInstanceOf().getValueToIdMap();
            keyToValue = TextEncoding.getInstanceOf().getIdToValueMap();
        }
        else if (identifier.equals(DataTypes.OBJ_INTERPOLATION_METHOD))
        {
            valueToKey = InterpolationTypes.getInstanceOf().getValueToIdMap();
            keyToValue = InterpolationTypes.getInstanceOf().getIdToValueMap();
        }
        else if (identifier.equals(DataTypes.OBJ_PICTURE_TYPE))
        {
            valueToKey = PictureTypes.getInstanceOf().getValueToIdMap();
            keyToValue = PictureTypes.getInstanceOf().getIdToValueMap();

            //Issue #224 Values should map, but have examples where they dont, this is a workaround
            hasEmptyValue = true;
        }
        else if (identifier.equals(DataTypes.OBJ_TYPE_OF_EVENT))
        {
            valueToKey = EventTimingTypes.getInstanceOf().getValueToIdMap();
            keyToValue = EventTimingTypes.getInstanceOf().getIdToValueMap();
        }
        else if (identifier.equals(DataTypes.OBJ_TIME_STAMP_FORMAT))
        {
            valueToKey = EventTimingTimestampTypes.getInstanceOf().getValueToIdMap();
            keyToValue = EventTimingTimestampTypes.getInstanceOf().getIdToValueMap();
        }
        else if (identifier.equals(DataTypes.OBJ_TYPE_OF_CHANNEL))
        {
            valueToKey = ChannelTypes.getInstanceOf().getValueToIdMap();
            keyToValue = ChannelTypes.getInstanceOf().getIdToValueMap();
        }
        else if (identifier.equals(DataTypes.OBJ_RECIEVED_AS))
        {
            valueToKey = ReceivedAsTypes.getInstanceOf().getValueToIdMap();
            keyToValue = ReceivedAsTypes.getInstanceOf().getIdToValueMap();
        }
        else if (identifier.equals(DataTypes.OBJ_CONTENT_TYPE))
        {
            valueToKey = SynchronisedLyricsContentType.getInstanceOf().getValueToIdMap();
            keyToValue = SynchronisedLyricsContentType.getInstanceOf().getIdToValueMap();
        }
        else
        {
            throw new IllegalArgumentException("Hashmap identifier not defined in this class: " + identifier);
        }
    }

    public NumberHashMap(NumberHashMap copyObject)
    {
        super(copyObject);

        this.hasEmptyValue = copyObject.hasEmptyValue;

        // we don't need to clone/copy the maps here because they are static
        this.keyToValue = copyObject.keyToValue;
        this.valueToKey = copyObject.valueToKey;
    }

    /**
     * @return the key to value map
     */
    public Map<Integer, String> getKeyToValue()
    {
        return keyToValue;
    }

    /**
     * @return the value to key map
     */
    public Map<String, Integer> getValueToKey()
    {
        return valueToKey;
    }

    /**
     * @param value
     */
    public void setValue(Object value)
    {
        if (value instanceof Byte)
        {
            this.value = (long) ((Byte) value).byteValue();
        }
        else if (value instanceof Short)
        {
            this.value = (long) ((Short) value).shortValue();
        }
        else if (value instanceof Integer)
        {
            this.value = (long) ((Integer) value).intValue();
        }
        else
        {
            this.value = value;
        }
    }

    /**
     * @param obj
     * @return
     */
    public boolean equals(Object obj)
    {
        if(obj==this)
        {
            return true;
        }
        
        if (!(obj instanceof NumberHashMap))
        {
            return false;
        }

        NumberHashMap that = (NumberHashMap) obj;

        return
              EqualsUtil.areEqual(hasEmptyValue, that.hasEmptyValue) &&
              EqualsUtil.areEqual(keyToValue, that.keyToValue) &&
              EqualsUtil.areEqual(valueToKey, that.valueToKey) &&
              super.equals(that);
    }

    /**
     * @return
     */
    public Iterator<String> iterator()
    {
        if (keyToValue == null)
        {
            return null;
        }
        else
        {
            // put them in a treeset first to sort them
            TreeSet<String> treeSet = new TreeSet<String>(keyToValue.values());

            if (hasEmptyValue)
            {
                treeSet.add("");
            }

            return treeSet.iterator();
        }
    }

    /**
     * Read the key from the buffer.
     *
     * @param arr
     * @param offset
     * @throws InvalidDataTypeException if emptyValues are not allowed and the eky was invalid.
     */
    public void readByteArray(byte[] arr, int offset) throws InvalidDataTypeException
    {
        super.readByteArray(arr, offset);

        //Mismatch:Superclass uses Long, but maps expect Integer
        Integer intValue = ((Long) value).intValue();
        if (!keyToValue.containsKey(intValue))
        {
            if (!hasEmptyValue)
            {
                throw new InvalidDataTypeException(ErrorMessage.MP3_REFERENCE_KEY_INVALID.getMsg(identifier, intValue));
            }
            else if (identifier.equals(DataTypes.OBJ_PICTURE_TYPE))
            {
                logger.warning(ErrorMessage.MP3_PICTURE_TYPE_INVALID.getMsg(value));
            }
        }
    }

    /**
     * @return
     */
    public String toString()
    {
        if (value == null)
        {
            return "";
        }
        else if (keyToValue.get(value) == null)
        {
            return "";
        }
        else
        {
            return keyToValue.get(value);
        }
    }
}
