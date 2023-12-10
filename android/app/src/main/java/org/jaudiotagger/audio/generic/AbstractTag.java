/*
 * jaudiotagger library
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.audio.generic;

import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.images.Artwork;

import java.nio.charset.Charset;
import java.util.*;

/**
 * This class is the default implementation for
 * {@link Tag} and introduces some more useful
 * functionality to be implemented.<br>
 *
 * @author Raphaël Slinckx
 */
public abstract class AbstractTag implements Tag
{
    /**
     * Stores the amount of {@link TagField} with {@link TagField#isCommon()}
     * <code>true</code>.
     */
    protected int commonNumber = 0;

    /**
     * This map stores the {@linkplain TagField#getId() ids} of the stored
     * fields to the {@linkplain TagField fields} themselves. Because a linked hashMap is used the order
     * that they are added in is preserved, the only exception to this rule is when two fields of the same id
     * exist, both will be returned according to when the first item was added to the file. <br>
     */
    protected Map<String, List<TagField>> fields = new LinkedHashMap<String, List<TagField>>();

    /**
     * Add field
     *
     * @see Tag#addField(TagField)
     *
     *      Changed so add empty fields
     */
    @Override
    public void addField(TagField field)
    {
        if (field == null)
        {
            return;
        }
        List<TagField> list = fields.get(field.getId());

        // There was no previous item
        if (list == null)
        {
            list = new ArrayList<TagField>();
            list.add(field);
            fields.put(field.getId(), list);
            if (field.isCommon())
            {
                commonNumber++;
            }
        }
        else
        {
            // We append to existing list
            list.add(field);
        }
    }


    /**
     * Get list of fields within this tag with the specified id
     *
     * @see Tag#getFields(String)
     */
    @Override
    public List<TagField> getFields(String id)
    {
        List<TagField> list = fields.get(id);

        if (list == null)
        {
            return new ArrayList<TagField>();
        }

        return list;
    }



    public List<String> getAll(String id) throws KeyNotFoundException
    {
        List<String>   fields = new ArrayList<String>();
        List<TagField> tagFields = getFields(id);
        for(TagField tagField:tagFields)
        {
            fields.add(tagField.toString());
        }
        return fields;
    }

    /**
     *
     * @param id
     * @param index
     * @return
     */
    public String getItem(String id,int index)
    {
        List<TagField> l = getFields(id);
        return (l.size()>index) ? l.get(index).toString() : "";
    }

    /**
     * Retrieve the first value that exists for this generic key
     *
     * @param genericKey
     * @return
     */
    @Override
    public String getFirst(FieldKey genericKey) throws KeyNotFoundException
    {
        return getValue(genericKey,0);
    }

    @Override
    public String getFirst(String id)
    {
        List<TagField> l = getFields(id);
        return (l.size() != 0) ? l.get(0).toString() : "";
    }

    @Override
    public TagField getFirstField(String id)
    {
        List<TagField> l = getFields(id);
        return (l.size() != 0) ? l.get(0) : null;
    }

    public List<TagField> getAll()
    {
        List<TagField> fieldList = new ArrayList<TagField>();
        for(List<TagField> listOfFields : fields.values())
        {
            for(TagField next:listOfFields)
            {
                fieldList.add(next);
            }
        }
        return fieldList;
    }

    @Override
    public Iterator<TagField> getFields()
    {
        final Iterator<Map.Entry<String, List<TagField>>> it = this.fields.entrySet().iterator();
        return new Iterator<TagField>()
        {
            private Iterator<TagField> fieldsIt;

            private void changeIt()
            {
                if (!it.hasNext())
                {
                    return;
                }

                Map.Entry<String, List<TagField>> e = it.next();
                List<TagField> l = e.getValue();
                fieldsIt = l.iterator();
            }

            @Override
            public boolean hasNext()
            {
                if (fieldsIt == null)
                {
                    changeIt();
                }
                return it.hasNext() || (fieldsIt != null && fieldsIt.hasNext());
            }

            @Override
            public TagField next()
            {
                if (!fieldsIt.hasNext())
                {
                    changeIt();
                }

                return fieldsIt.next();
            }

            @Override
            public void remove()
            {
                fieldsIt.remove();
            }
        };
    }

    /**
     * Return field count
     *
     * TODO:There must be a more efficient way to do this.
     *
     * @return field count
     */
    @Override
    public int getFieldCount()
    {
        Iterator it = getFields();
        int count = 0;
        while (it.hasNext())
        {
            count++;
            it.next();
        }
        return count;
    }

    @Override
    public int getFieldCountIncludingSubValues()
    {
        return getFieldCount();
    }

    /**
     * Does this tag contain any comon fields
     *
     * @see Tag#hasCommonFields()
     */
    @Override
    public boolean hasCommonFields()
    {
        return commonNumber != 0;
    }

    /**
     * Does this tag contain a field with the specified id
     *
     * @see Tag#hasField(String)
     */
    @Override
    public boolean hasField(String id)
    {
        return getFields(id).size() != 0;
    }

    @Override
    public boolean hasField(FieldKey fieldKey)
    {
        return hasField(fieldKey.name());
    }

    /**
     * Determines whether the given charset encoding may be used for the
     * represented tagging system.
     *
     * @param enc charset encoding.
     * @return <code>true</code> if the given encoding can be used.
     */
    protected abstract boolean isAllowedEncoding(Charset enc);

    /**
     * Is this tag empty
     *
     * @see Tag#isEmpty()
     */
    @Override
    public boolean isEmpty()
    {
        return fields.size() == 0;
    }

    /**
     * Create new field and set it in the tag
     *
     * @param genericKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    @Override
    public void setField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(genericKey,value);
        setField(tagfield);
    }

     /**
     * Create new field and add it to the tag
     *
     * @param genericKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
     @Override
    public void addField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException
    {
        TagField tagfield = createField(genericKey,value);
        addField(tagfield);
    }

    /**
     * Set field
     *
     * Changed:Just because field is empty it doesn't mean it should be deleted. That should be the choice
     * of the developer. (Or does this break things)
     *
     * @see Tag#setField(TagField)
     */
    @Override
    public void setField(TagField field)
    {
        if (field == null)
        {
            return;
        }

        // If there is already an existing field with same id
        // and both are TextFields, we replace the first element
        List<TagField> list = fields.get(field.getId());
        if (list != null)
        {
            list.set(0, field);
            return;
        }

        // Else we put the new field in the fields.
        list = new ArrayList<TagField>();
        list.add(field);
        fields.put(field.getId(), list);
        if (field.isCommon())
        {
            commonNumber++;
        }
    }

    /**
     * Set or add encoding
     *
     * @see Tag#setEncoding(String)
     */
    public boolean setEncoding(final Charset enc)
    {
        if (!isAllowedEncoding(enc))
        {
            return false;
        }

        Iterator it = getFields();
        while (it.hasNext())
        {
            TagField field = (TagField) it.next();
            if (field instanceof TagTextField)
            {
                ((TagTextField) field).setEncoding(enc);
            }
        }

        return true;
    }

    /**
     * (overridden)
     *
     * @see Object#toString()
     */
    public String toString()
    {
        StringBuffer out = new StringBuffer();
        out.append("Tag content:\n");
        Iterator it = getFields();
        while (it.hasNext())
        {
            TagField field = (TagField) it.next();
            out.append("\t");
            out.append(field.getId());
            out.append(":");
            out.append(field.toString());
            out.append("\n");
        }
        return out.toString().substring(0, out.length() - 1);
    }

    /**
     *
     * @param genericKey
     * @param value
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    public abstract TagField createField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException;

    /**
     * 
     * @param genericKey
     * @return
     * @throws KeyNotFoundException
     */
    public abstract TagField getFirstField(FieldKey genericKey) throws KeyNotFoundException;

    /**
     * 
     * @param fieldKey
     * @throws KeyNotFoundException
     */
    public abstract void deleteField(FieldKey fieldKey) throws KeyNotFoundException;


    /**
     * Delete all occurrences of field with this id.
     *
     * @param key
     */
    public void deleteField(String key)
    {
        fields.remove(key);
    }

    public Artwork getFirstArtwork()
    {
        List<Artwork> artwork = getArtworkList();
        if(artwork.size()>0)
        {
            return artwork.get(0);
        }
        return null;
    }

     /**
     * Create field and then set within tag itself
     *
     * @param artwork
     * @throws FieldDataInvalidException
     */
    public void setField(Artwork artwork) throws FieldDataInvalidException
    {
        this.setField(createField(artwork));
    }

     /**
     * Create field and then add within tag itself
     *
     * @param artwork
     * @throws FieldDataInvalidException
     */
    public void addField(Artwork artwork) throws FieldDataInvalidException
    {
       this.addField(createField(artwork));
    }


    /**
     * Delete all instance of artwork Field
     *
     * @throws KeyNotFoundException
     */
    public void deleteArtworkField() throws KeyNotFoundException
    {
        this.deleteField(FieldKey.COVER_ART);
    }



}
