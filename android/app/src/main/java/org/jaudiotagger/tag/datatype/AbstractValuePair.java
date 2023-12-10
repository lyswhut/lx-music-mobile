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
 */
package org.jaudiotagger.tag.datatype;

import java.util.*;

/**
 * A two way mapping between an id and a value
 */
public abstract class AbstractValuePair<I, V>
{
    protected final Map<I, V> idToValue = new LinkedHashMap<I, V>();
    protected final Map<V, I> valueToId = new LinkedHashMap<V, I>();
    protected final List<V> valueList = new ArrayList<V>();

    protected Iterator<I> iterator = idToValue.keySet().iterator();

    protected String value;

    /**
     * Get list in alphabetical order
     * @return
     */
    public List<V> getAlphabeticalValueList()
    {
        return valueList;
    }

    public Map<I, V> getIdToValueMap()
    {
        return idToValue;
    }

    public Map<V, I> getValueToIdMap()
    {
        return valueToId;
    }

    /**
     * @return the number of elements in the mapping
     */
    public int getSize()
    {
        return valueList.size();
    }
}
