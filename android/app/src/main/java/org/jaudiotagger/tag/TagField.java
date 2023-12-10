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
package org.jaudiotagger.tag;

import java.io.UnsupportedEncodingException;

/**
 * Implementing classes represent a tag field for the entagged audio library.<br>
 * Very basic functionality is defined for use with
 * {@link Tag}.
 *
 * @author Rapha�l Slinckx
 */
public interface TagField
{

    /**
     * This method copies the data of the given field to the current data.<br>
     *
     * @param field The field containing the data to be taken.
     */
    public void copyContent(TagField field);

    /**
     * Returns the Id of the represented tag field.<br>
     * This value should uniquely identify a kind of tag data, like title.
     * {@link org.jaudiotagger.audio.generic.AbstractTag} will use the &quot;id&quot; to summarize multiple
     * fields.
     *
     * @return Unique identifier for the fields type. (title, artist...)
     */
    public String getId();

    /**
     * This method delivers the binary representation of the fields data in
     * order to be directly written to the file.<br>
     *
     * @return Binary data representing the current tag field.<br>
     * @throws UnsupportedEncodingException Most tag data represents text. In some cases the underlying
     *                                      implementation will need to convert the text data in java to
     *                                      a specific charset encoding. In these cases an
     *                                      {@link UnsupportedEncodingException} may occur.
     */
    public byte[] getRawContent() throws UnsupportedEncodingException;

    /**
     * Determines whether the represented field contains (is made up of) binary
     * data, instead of text data.<br>
     * Software can identify fields to be displayed because they are human
     * readable if this method returns <code>false</code>.
     *
     * @return <code>true</code> if field represents binary data (not human
     *         readable).
     */
    public boolean isBinary();

    /**
     * This method will set the field to represent binary data.<br>
     *
     * Some implementations may support conversions.<br>
     * As of now (Octobre 2005) there is no implementation really using this
     * method to perform useful operations.
     *
     * @param b <code>true</code>, if the field contains binary data.
     *          //@deprecated As for now is of no use. Implementations should use another
     *          //            way of setting this property.
     */
    public void isBinary(boolean b);

    /**
     * Identifies a field to be of common use.<br>
     *
     * Some software may differ between common and not common fields. A common
     * one is for sure the title field. A web link may not be of common use for
     * tagging. However some file formats, or future development of users
     * expectations will make more fields common than now can be known.
     *
     * @return <code>true</code> if the field is of common use.
     */
    public boolean isCommon();

    /**
     * Determines whether the content of the field is empty.<br>
     *
     * @return <code>true</code> if no data is stored (or empty String).
     */
    public boolean isEmpty();

    /**
     * This method returns a human readable description of the fields contents.<br>
     * For text fields it should be the text itself. Other fields containing
     * images may return a formatted string with image properties like width,
     * height and so on.
     *
     * @return Description of the fields content.
     */
    public String toString();
}