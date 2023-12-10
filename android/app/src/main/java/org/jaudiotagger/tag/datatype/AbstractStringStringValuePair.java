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

import java.util.Collections;

public class AbstractStringStringValuePair extends AbstractValuePair<String, String>
{
    protected String lkey = null;

    /**
     * Get Id for Value
     * @param value
     * @return
     */
    public String getIdForValue(String value)
    {
        return valueToId.get(value);
    }

    /**
     * Get value for Id
     * @param id
     * @return
     */
    public String getValueForId(String id)
    {
        return idToValue.get(id);
    }

    protected void createMaps()
    {
        iterator = idToValue.keySet().iterator();
        while (iterator.hasNext())
        {
            lkey = iterator.next();
            value = idToValue.get(lkey);
            valueToId.put(value, lkey);
        }

        //Value List
        iterator = idToValue.keySet().iterator();
        while (iterator.hasNext())
        {
            valueList.add(idToValue.get(iterator.next()));
        }
        //Sort alphabetically
        Collections.sort(valueList);
    }
}
