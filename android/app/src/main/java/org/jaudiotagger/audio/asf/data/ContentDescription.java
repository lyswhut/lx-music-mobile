/*
 * Entagged Audio Tag library
 * Copyright (c) 2004-2005 Christian Laireiter <liree@web.de>
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
package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigInteger;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * This class represents the data of a chunk which contains title, author,
 * copyright, description and the rating of the file. <br>
 * It is optional within ASF files. But if, exists only once.
 *
 * @author Christian Laireiter
 */
public final class ContentDescription extends MetadataContainer
{
    /**
     * Stores the only allowed keys of this metadata container.
     */
    public final static Set<String> ALLOWED;

    /**
     * Field key for author.
     */
    public final static String KEY_AUTHOR = "AUTHOR";

    /**
     * Field key for copyright.
     */
    public final static String KEY_COPYRIGHT = "COPYRIGHT";

    /**
     * Field key for description.
     */
    public final static String KEY_DESCRIPTION = "DESCRIPTION";

    /**
     * Field key for rating.
     */
    public final static String KEY_RATING = "RATING";

    /**
     * Field key for title.
     */
    public final static String KEY_TITLE = "TITLE";

    static
    {
        ALLOWED = new HashSet<String>(Arrays.asList(KEY_AUTHOR, KEY_COPYRIGHT, KEY_DESCRIPTION, KEY_RATING, KEY_TITLE));
    }

    /**
     * Creates an instance. <br>
     */
    public ContentDescription()
    {
        this(0, BigInteger.ZERO);
    }

    /**
     * Creates an instance.
     *
     * @param pos      Position of content description within file or stream
     * @param chunkLen Length of content description.
     */
    public ContentDescription(final long pos, final BigInteger chunkLen)
    {
        super(ContainerType.CONTENT_DESCRIPTION, pos, chunkLen);
    }

    /**
     * @return Returns the author.
     */
    public String getAuthor()
    {
        return getValueFor(KEY_AUTHOR);
    }

    /**
     * @return Returns the comment.
     */
    public String getComment()
    {
        return getValueFor(KEY_DESCRIPTION);
    }

    /**
     * @return Returns the copyRight.
     */
    public String getCopyRight()
    {
        return getValueFor(KEY_COPYRIGHT);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public long getCurrentAsfChunkSize()
    {
        long result = 44; // GUID + UINT64 for size + 5 times string length
        // (each
        // 2 bytes) + 5 times zero term char (2 bytes each).
        result += getAuthor().length() * 2; // UTF-16LE
        result += getComment().length() * 2;
        result += getRating().length() * 2;
        result += getTitle().length() * 2;
        result += getCopyRight().length() * 2;
        return result;
    }

    /**
     * @return returns the rating.
     */
    public String getRating()
    {
        return getValueFor(KEY_RATING);
    }

    /**
     * @return Returns the title.
     */
    public String getTitle()
    {
        return getValueFor(KEY_TITLE);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isAddSupported(final MetadataDescriptor descriptor)
    {
        return ALLOWED.contains(descriptor.getName()) && super.isAddSupported(descriptor);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        result.append(prefix).append("  |->Title      : ").append(getTitle()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |->Author     : ").append(getAuthor()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |->Copyright  : ").append(getCopyRight()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |->Description: ").append(getComment()).append(Utils.LINE_SEPARATOR);
        result.append(prefix).append("  |->Rating     :").append(getRating()).append(Utils.LINE_SEPARATOR);
        return result.toString();
    }

    /**
     * @param fileAuthor The author to set.
     * @throws IllegalArgumentException If "UTF-16LE"-byte-representation would take more than 65535
     *                                  bytes.
     */
    public void setAuthor(final String fileAuthor) throws IllegalArgumentException
    {
        setStringValue(KEY_AUTHOR, fileAuthor);
    }

    /**
     * @param tagComment The comment to set.
     * @throws IllegalArgumentException If "UTF-16LE"-byte-representation would take more than 65535
     *                                  bytes.
     */
    public void setComment(final String tagComment) throws IllegalArgumentException
    {
        setStringValue(KEY_DESCRIPTION, tagComment);
    }

    /**
     * @param cpright The copyRight to set.
     * @throws IllegalArgumentException If "UTF-16LE"-byte-representation would take more than 65535
     *                                  bytes.
     */
    public void setCopyright(final String cpright) throws IllegalArgumentException
    {
        setStringValue(KEY_COPYRIGHT, cpright);
    }

    /**
     * @param ratingText The rating to be set.
     * @throws IllegalArgumentException If "UTF-16LE"-byte-representation would take more than 65535
     *                                  bytes.
     */
    public void setRating(final String ratingText) throws IllegalArgumentException
    {
        setStringValue(KEY_RATING, ratingText);
    }

    /**
     * @param songTitle The title to set.
     * @throws IllegalArgumentException If "UTF-16LE"-byte-representation would take more than 65535
     *                                  bytes.
     */
    public void setTitle(final String songTitle) throws IllegalArgumentException
    {
        setStringValue(KEY_TITLE, songTitle);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public long writeInto(final OutputStream out) throws IOException
    {
        final long chunkSize = getCurrentAsfChunkSize();

        out.write(this.getGuid().getBytes());
        Utils.writeUINT64(getCurrentAsfChunkSize(), out);
        // write the sizes of the string representations plus 2 bytes zero term
        // character
        Utils.writeUINT16(getTitle().length() * 2 + 2, out);
        Utils.writeUINT16(getAuthor().length() * 2 + 2, out);
        Utils.writeUINT16(getCopyRight().length() * 2 + 2, out);
        Utils.writeUINT16(getComment().length() * 2 + 2, out);
        Utils.writeUINT16(getRating().length() * 2 + 2, out);
        // write the Strings
        out.write(Utils.getBytes(getTitle(), AsfHeader.ASF_CHARSET));
        out.write(AsfHeader.ZERO_TERM);
        out.write(Utils.getBytes(getAuthor(), AsfHeader.ASF_CHARSET));
        out.write(AsfHeader.ZERO_TERM);
        out.write(Utils.getBytes(getCopyRight(), AsfHeader.ASF_CHARSET));
        out.write(AsfHeader.ZERO_TERM);
        out.write(Utils.getBytes(getComment(), AsfHeader.ASF_CHARSET));
        out.write(AsfHeader.ZERO_TERM);
        out.write(Utils.getBytes(getRating(), AsfHeader.ASF_CHARSET));
        out.write(AsfHeader.ZERO_TERM);
        return chunkSize;
    }
}