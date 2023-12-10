/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
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

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.logging.ErrorMessage;
import org.jaudiotagger.tag.*;
import org.jaudiotagger.tag.images.Artwork;

import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;

/**
 * This is a complete example implementation of  {@link AbstractTag}
 *
 * @author Raphaël Slinckx
 */
public abstract class GenericTag extends AbstractTag
{
    private static final byte[] EMPTY_BYTE_ARRAY = new byte[]{};
    protected static EnumSet<FieldKey> supportedKeys;

    static
    {
        supportedKeys = EnumSet.of(FieldKey.ALBUM,FieldKey.ARTIST,FieldKey.TITLE,FieldKey.TRACK,FieldKey.GENRE,FieldKey.COMMENT,FieldKey.YEAR);
    }


    public static  EnumSet<FieldKey>  getSupportedKeys()
    {
        return supportedKeys;
    }

    /**
     * Implementations of {@link TagTextField} for use with
     * &quot;ISO-8859-1&quot; strings.
     *
     * @author Raphaël Slinckx
     */
    protected class GenericTagTextField implements TagTextField
    {

        /**
         * Stores the string.
         */
        private String content;

        /**
         * Stores the identifier.
         */
        private final String id;

        /**
         * Creates an instance.
         *
         * @param fieldId        The identifier.
         * @param initialContent The string.
         */
        public GenericTagTextField(final String fieldId, final String initialContent)
        {
            this.id = fieldId;
            this.content = initialContent;
        }

        @Override
        public void copyContent(final TagField field)
        {
            if (field instanceof TagTextField)
            {
                this.content = ((TagTextField) field).getContent();
            }
        }

        @Override
        public String getContent()
        {
            return this.content;
        }

        @Override
        public Charset getEncoding()
        {
            return StandardCharsets.ISO_8859_1;
        }

        @Override
        public String getId()
        {
            return id;
        }

        @Override
        public byte[] getRawContent()
        {
            return this.content == null ? EMPTY_BYTE_ARRAY : this.content.getBytes(getEncoding());
        }

        @Override
        public boolean isBinary()
        {
            return false;
        }

        @Override
        public void isBinary(boolean b)
        {
            /* not supported */
        }

        @Override
        public boolean isCommon()
        {
            return true;
        }

        @Override
        public boolean isEmpty()
        {
            return "".equals(this.content);
        }

        @Override
        public void setContent(final String s)
        {
            this.content = s;
        }

        @Override
        public void setEncoding(final Charset s)
        {
            /* Not allowed */
        }

        @Override
        public String toString()
        {
            return getContent();
        }
    }

    @Override
    protected boolean isAllowedEncoding(final Charset enc)
    {
        return true;
    }

    @Override
    public TagField createField(final FieldKey genericKey, final String... values) throws KeyNotFoundException, FieldDataInvalidException
    {
        if(supportedKeys.contains(genericKey))
        {
            if (values == null || values[0] == null)
            {
                throw new IllegalArgumentException(ErrorMessage.GENERAL_INVALID_NULL_ARGUMENT.getMsg());
            }
            return new GenericTagTextField(genericKey.name(),values[0]);
        }
        else
        {
            throw new UnsupportedOperationException(ErrorMessage.OPERATION_NOT_SUPPORTED_FOR_FIELD.getMsg(genericKey));
        }
    }

    @Override
    public String getFirst(final FieldKey genericKey) throws KeyNotFoundException
    {
        return getValue(genericKey, 0);
    }

    @Override
    public String getValue(final FieldKey genericKey, final int index) throws KeyNotFoundException
    {
        if(supportedKeys.contains(genericKey))
        {
            return getItem(genericKey.name(),index);
        }
        else
        {
            throw new UnsupportedOperationException(ErrorMessage.OPERATION_NOT_SUPPORTED_FOR_FIELD.getMsg(genericKey));
        }
    }

    @Override
    public List<TagField> getFields(final FieldKey genericKey) throws KeyNotFoundException
    {
        List<TagField> list = fields.get(genericKey.name());
        if (list == null)
        {
            return new ArrayList<TagField>();
        }
        return list;
    }

    @Override
    public List<String> getAll(final FieldKey genericKey) throws KeyNotFoundException
    {
        return super.getAll(genericKey.name());
    }

    @Override
    public void deleteField(final FieldKey genericKey) throws KeyNotFoundException
    {
        if(supportedKeys.contains(genericKey))
        {
            deleteField(genericKey.name());
        }
        else
        {
            throw new UnsupportedOperationException(ErrorMessage.OPERATION_NOT_SUPPORTED_FOR_FIELD.getMsg(genericKey));
        }
    }

    @Override
    public TagField getFirstField(final FieldKey genericKey) throws KeyNotFoundException
    {
        if(supportedKeys.contains(genericKey))
        {
            return getFirstField(genericKey.name());
        }
        else
        {
            throw new UnsupportedOperationException(ErrorMessage.OPERATION_NOT_SUPPORTED_FOR_FIELD.getMsg(genericKey));
        }
    }

    @Override
    public List<Artwork> getArtworkList()
    {
        return Collections.emptyList();
    }

    @Override
    public TagField createField(final Artwork artwork) throws FieldDataInvalidException
    {
        throw new UnsupportedOperationException(ErrorMessage.GENERIC_NOT_SUPPORTED.getMsg());
    }
}
