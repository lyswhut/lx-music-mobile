/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2010 Raphaël Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.tag;

import org.jaudiotagger.tag.images.Artwork;

import java.nio.charset.Charset;
import java.util.Iterator;
import java.util.List;

/**
 * This interface represents the basic data structure for the default
 * audio library functionality.<br>
 *
 * Some audio file tagging systems allow to specify multiple values for one type
 * of information. The artist for example. Some songs may be a cooperation of
 * two or more artists. Sometimes a tagging user wants to specify them in the
 * tag without making one long text string.<br>
 *
 * The addField() method can be used for this but it is possible the underlying implementation
 * does not support that kind of storing multiple values and will just overwrite the existing value<br>
 * <br>
 * <b>Code Examples:</b><br>
 *
 * <pre>
 * <code>
 * AudioFile file = AudioFileIO.read(new File(&quot;C:\\test.mp3&quot;));
 *
 * Tag tag = file.getTag();
 * </code>
 * </pre>
 *
 * @author Raphael Slinckx
 * @author Paul Taylor
 */
public interface Tag {

    /**
     * Create the field based on the generic key and set it in the tag
     *
     * @param genericKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    void setField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException;

    /**
     * Create the field based on the generic key and add it to the tag
     *
     * This is handled differently by different formats
     *
     * @param genericKey
     * @param value
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    void addField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException;

    /**
     * Delete any fields with this key
     *
     * @param fieldKey
     * @throws KeyNotFoundException
     */
    void deleteField(FieldKey fieldKey) throws KeyNotFoundException;

    /**
     * Delete any fields with this Flac (Vorbis Comment) id
     *
     * @param key
     * @throws KeyNotFoundException
     */
    void deleteField(String key)throws KeyNotFoundException;

    /**
     * Returns a {@linkplain List list} of {@link TagField} objects whose &quot;{@linkplain TagField#getId() id}&quot;
     * is the specified one.<br>
     *
     * <p>Can be used to retrieve fields with any identifier, useful if the identifier is not within {@link FieldKey}
     *
     * @param id The field id.
     * @return A list of {@link TagField} objects with the given &quot;id&quot;.
     */
    List<TagField> getFields(String id);

    /**
     * Returns a {@linkplain List list} of {@link TagField} objects whose &quot;{@linkplain TagField#getId() id}&quot;
     * is the specified one.<br>
     *
     * @param id The field id.
     * @return A list of {@link TagField} objects with the given &quot;id&quot;.
     * @throws KeyNotFoundException
     */
    List<TagField> getFields(FieldKey id) throws KeyNotFoundException;


    /**
     * Iterator over all the fields within the tag, handle multiple fields with the same id
     *
     * @return iterator over whole list
     */
    Iterator<TagField> getFields();


    /**
     * Retrieve String value of the first value that exists for this format specific key
     *
     * <p>Can be used to retrieve fields with any identifier, useful if the identifier is not within {@link FieldKey}
     *
     * @param id
     * @return
     */
    String getFirst(String id);

    /**
     * Retrieve String value of the first tag field that exists for this generic key
     *
     * @param id
     * @return String value or empty string
     * @throws KeyNotFoundException
     */
    String getFirst(FieldKey id) throws KeyNotFoundException;

    /**
     * Retrieve all String values that exist for this generic key
     *
     * @param id
     * @return
     * @throws KeyNotFoundException
     */
    List<String> getAll(FieldKey id) throws KeyNotFoundException;

    /**
     * Retrieve String value of the nth tag field that exists for this generic key
     *
     * @param id
     * @param n
     * @return
     */
    String getValue(FieldKey id, int n);

    /**
     * Retrieve the first field that exists for this format specific key
     *
     * <p>Can be used to retrieve fields with any identifier, useful if the identifier is not within {@link FieldKey}
     *
     * @param id audio specific key
     * @return tag field or null if doesn't exist
     */
    TagField getFirstField(String id);

    /**
     * @param id
     * @return the first field that matches this generic key
     */
    TagField getFirstField(FieldKey id);

    /**
     * Returns <code>true</code>, if at least one of the contained
     * {@linkplain TagField fields} is a common field ({@link TagField#isCommon()}).
     *
     * @return <code>true</code> if a {@linkplain TagField#isCommon() common}
     *         field is present.
     */
    boolean hasCommonFields();

    /**
     * Determines whether the tag has at least one field with the specified field key.
     *
     * @param fieldKey
     * @return
     */
    boolean hasField(FieldKey fieldKey);

    /**
     * Determines whether the tag has at least one field with the specified
     * &quot;id&quot;.
     *
     * @param id The field id to look for.
     * @return <code>true</code> if tag contains a {@link TagField} with the
     *         given {@linkplain TagField#getId() id}.
     */
    boolean hasField(String id);

    /**
     * Determines whether the tag has no fields specified.<br>
     *
     * @return <code>true</code> if tag contains no field.
     */
    boolean isEmpty();


    //TODO, do we need this
    String toString();

    /**
     * Return the number of fields
     *
     * <p>Fields with the same identifiers are counted separately
     *
     * i.e two TITLE fields in a Vorbis Comment file would count as two
     *
     * @return total number of fields
     */
    int getFieldCount();


    /**
     * Return the number of fields taking multiple value fields into consideration
     *
     * Fields that actually contain multiple values are counted seperately
     *
     * i.e. a TCON frame in ID3v24 frame containing multiple genres would add to count for each genre.
     *
     * @return total number of fields taking multiple value fields into consideration
     */
    int getFieldCountIncludingSubValues();


    //TODO is this a special field?
    boolean setEncoding(Charset enc) throws FieldDataInvalidException;


    /**
     * @return a list of all artwork in this file using the format independent Artwork class
     */
    List<Artwork> getArtworkList();

    /**
     * @return first artwork or null if none exist
     */
    Artwork getFirstArtwork();

    /**
     * Delete any instance of tag fields used to store artwork
     *
     * <p>We need this additional deleteField method because in some formats artwork can be stored
     * in multiple fields
     *
     * @throws KeyNotFoundException
     */
    void deleteArtworkField() throws KeyNotFoundException;


    /**
     * Create artwork field based on the data in artwork
     *
     * @param artwork
     * @return suitable tagfield for this format that represents the artwork data
     * @throws FieldDataInvalidException
     */
    TagField createField(Artwork artwork) throws FieldDataInvalidException;

    /**
     * Create artwork field based on the data in artwork and then set it in the tag itself
     *
     *
     * @param artwork
     * @throws FieldDataInvalidException
     */
    void setField(Artwork artwork) throws FieldDataInvalidException;

    /**
     * Create artwork field based on the data in artwork and then add it to the tag itself
     *
     *
     * @param artwork
     * @throws FieldDataInvalidException
     */
    void addField(Artwork artwork) throws FieldDataInvalidException;

    /**
     * Sets a field in the structure, used internally by the library<br>
     *
     *
     * @param field The field to add.
     * @throws FieldDataInvalidException
     */
    void setField(TagField field) throws FieldDataInvalidException;

    /**
     * Adds a field to the structure, used internally by the library<br>
     *
     *
     * @param field The field to add.
     * @throws FieldDataInvalidException
     */
    void addField(TagField field) throws FieldDataInvalidException;

    /**
     * Create a new field based on generic key, used internally by the library
     *
     * <p>Only textual data supported at the moment. The genericKey will be mapped
     * to the correct implementation key and return a TagField.
     *
     * Usually the value field should only be one value, but certain fields may require more than one value
     * currently the only field to require this is the MUSICIAN field, it should contain instrument and then
     * performer name
     *
     * @param genericKey is the generic key
     * @param value      to store
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    TagField createField(FieldKey genericKey, String... value) throws KeyNotFoundException, FieldDataInvalidException;

    /**
     * Creates isCompilation field
     *
     * It is useful to have this method because it handles ensuring that the correct value to represent a boolean
     * is stored in the underlying field format.
     *
     * @param value
     * @return
     * @throws KeyNotFoundException
     * @throws FieldDataInvalidException
     */
    TagField createCompilationField(boolean value) throws KeyNotFoundException, FieldDataInvalidException;

}