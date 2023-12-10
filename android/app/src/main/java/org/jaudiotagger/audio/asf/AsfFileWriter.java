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
package org.jaudiotagger.audio.asf;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.asf.data.AsfHeader;
import org.jaudiotagger.audio.asf.data.ChunkContainer;
import org.jaudiotagger.audio.asf.data.MetadataContainer;
import org.jaudiotagger.audio.asf.io.*;
import org.jaudiotagger.audio.asf.util.TagConverter;
import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.generic.AudioFileWriter;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.asf.AsfTag;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.ArrayList;
import java.util.List;

/**
 * This class writes given tags to ASF files containing WMA content. <br>
 * <br>
 *
 * @author Christian Laireiter
 */
public class AsfFileWriter extends AudioFileWriter
{

    /**
     * {@inheritDoc}
     */
    @Override
    protected void deleteTag(Tag tag, final RandomAccessFile raf, final RandomAccessFile tempRaf) throws CannotWriteException, IOException
    {
        writeTag(null, new AsfTag(true), raf, tempRaf);
    }

    private boolean[] searchExistence(final ChunkContainer container, final MetadataContainer[] metaContainers)
    {
        assert container != null;
        assert metaContainers != null;
        final boolean[] result = new boolean[metaContainers.length];
        for (int i = 0; i < result.length; i++)
        {
            result[i] = container.hasChunkByGUID(metaContainers[i].getContainerType().getContainerGUID());
        }
        return result;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected void writeTag(AudioFile audioFile, final Tag tag, final RandomAccessFile raf, final RandomAccessFile rafTemp) throws CannotWriteException, IOException
    {
        /*
         * Since this implementation should not change the structure of the ASF
         * file (locations of content description chunks), we need to read the
         * content description chunk and the extended content description chunk
         * from the source file. In the second step we need to determine which
         * modifier (asf header or asf extended header) gets the appropriate
         * modifiers. The following policies are applied: if the source does not
         * contain any descriptor, the necessary descriptors are appended to the
         * header object.
         * 
         * if the source contains only one descriptor in the header extension
         * object, and the other type is needed as well, the other one will be
         * put into the header extension object.
         * 
         * for each descriptor type, if an object is found, an updater will be
         * configured.
         */
        final AsfHeader sourceHeader = AsfHeaderReader.readTagHeader(raf);
        raf.seek(0); // Reset for the streamer
        /*
         * Now createField modifiers for metadata descriptor and extended content
         * descriptor as implied by the given Tag.
         */
        // TODO not convinced that we need to copy fields here
        final AsfTag copy = new AsfTag(tag, true);
        final MetadataContainer[] distribution = TagConverter.distributeMetadata(copy);
        final boolean[] existHeader = searchExistence(sourceHeader, distribution);
        final boolean[] existExtHeader = searchExistence(sourceHeader.getExtendedHeader(), distribution);
        // Modifiers for the asf header object
        final List<ChunkModifier> headerModifier = new ArrayList<ChunkModifier>();
        // Modifiers for the asf header extension object
        final List<ChunkModifier> extHeaderModifier = new ArrayList<ChunkModifier>();
        for (int i = 0; i < distribution.length; i++)
        {
            final WriteableChunkModifer modifier = new WriteableChunkModifer(distribution[i]);
            if (existHeader[i])
            {
                // Will remove or modify chunks in ASF header
                headerModifier.add(modifier);
            }
            else if (existExtHeader[i])
            {
                // Will remove or modify chunks in extended header
                extHeaderModifier.add(modifier);
            }
            else
            {
                // Objects (chunks) will be added here.
                if (i == 0 || i == 2 || i == 1)
                {
                    // Add content description and extended content description
                    // at header for maximum compatibility
                    headerModifier.add(modifier);
                }
                else
                {
                    // For now, the rest should be created at extended header
                    // since other positions aren't known.
                    extHeaderModifier.add(modifier);
                }
            }
        }
        // only addField an AsfExtHeaderModifier, if there is actually something to
        // change (performance)
        if (!extHeaderModifier.isEmpty())
        {
            headerModifier.add(new AsfExtHeaderModifier(extHeaderModifier));
        }
        new AsfStreamer().createModifiedCopy(new RandomAccessFileInputstream(raf), new RandomAccessFileOutputStream(rafTemp), headerModifier);
    }

}