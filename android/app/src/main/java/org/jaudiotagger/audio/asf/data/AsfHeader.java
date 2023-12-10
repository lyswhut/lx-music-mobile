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

import java.math.BigInteger;
import java.nio.charset.Charset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Each ASF file starts with a so called header. <br>
 * This header contains other chunks. Each chunk starts with a 16 byte GUID
 * followed by the length (in bytes) of the chunk (including GUID). The length
 * number takes 8 bytes and is unsigned. Finally the chunk's data appears. <br>
 *
 * @author Christian Laireiter
 */
public final class AsfHeader extends ChunkContainer
{
    /**
     * The charset &quot;UTF-16LE&quot; is mandatory for ASF handling.
     */
    public final static Charset ASF_CHARSET = Charset.forName("UTF-16LE"); //$NON-NLS-1$

    /**
     * Byte sequence representing the zero term character.
     */
    public final static byte[] ZERO_TERM = {0, 0};

    static
    {
        Set<GUID> MULTI_CHUNKS = new HashSet<GUID>();
        MULTI_CHUNKS.add(GUID.GUID_STREAM);
    }

    /**
     * An ASF header contains multiple chunks. <br>
     * The count of those is stored here.
     */
    private final long chunkCount;

    /**
     * Creates an instance.
     *
     * @param pos      see {@link Chunk#position}
     * @param chunkLen see {@link Chunk#chunkLength}
     * @param chunkCnt
     */
    public AsfHeader(final long pos, final BigInteger chunkLen, final long chunkCnt)
    {
        super(GUID.GUID_HEADER, pos, chunkLen);
        this.chunkCount = chunkCnt;
    }

    /**
     * This method looks for an content description object in this header
     * instance, if not found there, it tries to get one from a contained ASF
     * header extension object.
     *
     * @return content description if found, <code>null</code> otherwise.
     */
    public ContentDescription findContentDescription()
    {
        ContentDescription result = getContentDescription();
        if (result == null && getExtendedHeader() != null)
        {
            result = getExtendedHeader().getContentDescription();
        }
        return result;
    }

    /**
     * This method looks for an extended content description object in this
     * header instance, if not found there, it tries to get one from a contained
     * ASF header extension object.
     *
     * @return extended content description if found, <code>null</code>
     * otherwise.
     */
    public MetadataContainer findExtendedContentDescription()
    {
        MetadataContainer result = getExtendedContentDescription();
        if (result == null && getExtendedHeader() != null)
        {
            result = getExtendedHeader().getExtendedContentDescription();
        }
        return result;
    }

    /**
     * This method searches for a metadata container of the given type.<br>
     *
     * @param type the type of the container to look up.
     * @return a container of specified type, of <code>null</code> if not
     * contained.
     */
    public MetadataContainer findMetadataContainer(final ContainerType type)
    {
        MetadataContainer result = (MetadataContainer) getFirst(type.getContainerGUID(), MetadataContainer.class);
        if (result == null)
        {
            result = (MetadataContainer) getExtendedHeader().getFirst(type.getContainerGUID(), MetadataContainer.class);
        }
        return result;
    }

    /**
     * This method returns the first audio stream chunk found in the asf file or
     * stream.
     *
     * @return Returns the audioStreamChunk.
     */
    public AudioStreamChunk getAudioStreamChunk()
    {
        AudioStreamChunk result = null;
        final List<Chunk> streamChunks = assertChunkList(GUID.GUID_STREAM);
        for (int i = 0; i < streamChunks.size() && result == null; i++)
        {
            if (streamChunks.get(i) instanceof AudioStreamChunk)
            {
                result = (AudioStreamChunk) streamChunks.get(i);
            }
        }
        return result;
    }

    /**
     * Returns the amount of chunks, when this instance was created.<br>
     * If chunks have been added, this won't be reflected with this call.<br>
     * For that use {@link #getChunks()}.
     *
     * @return Chunkcount at instance creation.
     */
    public long getChunkCount()
    {
        return this.chunkCount;
    }

    /**
     * @return Returns the contentDescription.
     */
    public ContentDescription getContentDescription()
    {
        return (ContentDescription) getFirst(GUID.GUID_CONTENTDESCRIPTION, ContentDescription.class);
    }

    /**
     * @return Returns the encodingChunk.
     */
    public EncodingChunk getEncodingChunk()
    {
        return (EncodingChunk) getFirst(GUID.GUID_ENCODING, EncodingChunk.class);
    }

    /**
     * @return Returns the encodingChunk.
     */
    public EncryptionChunk getEncryptionChunk()
    {
        return (EncryptionChunk) getFirst(GUID.GUID_CONTENT_ENCRYPTION, EncryptionChunk.class);
    }

    /**
     * @return Returns the tagHeader.
     */
    public MetadataContainer getExtendedContentDescription()
    {
        return (MetadataContainer) getFirst(GUID.GUID_EXTENDED_CONTENT_DESCRIPTION, MetadataContainer.class);
    }

    /**
     * @return Returns the extended header.
     */
    public AsfExtendedHeader getExtendedHeader()
    {
        return (AsfExtendedHeader) getFirst(GUID.GUID_HEADER_EXTENSION, AsfExtendedHeader.class);
    }

    /**
     * @return Returns the fileHeader.
     */
    public FileHeader getFileHeader()
    {
        return (FileHeader) getFirst(GUID.GUID_FILE, FileHeader.class);
    }

    /**
     * @return Returns the streamBitratePropertiesChunk.
     */
    public StreamBitratePropertiesChunk getStreamBitratePropertiesChunk()
    {
        return (StreamBitratePropertiesChunk) getFirst(GUID.GUID_STREAM_BITRATE_PROPERTIES, StreamBitratePropertiesChunk.class);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix, prefix + "  | : Contains: \"" + getChunkCount() + "\" chunks" + Utils.LINE_SEPARATOR));
        return result.toString();
    }
}