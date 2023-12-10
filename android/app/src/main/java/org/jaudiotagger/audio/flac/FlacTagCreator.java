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
package org.jaudiotagger.audio.flac;

import org.jaudiotagger.audio.flac.metadatablock.BlockType;
import org.jaudiotagger.audio.flac.metadatablock.MetadataBlockDataPadding;
import org.jaudiotagger.audio.flac.metadatablock.MetadataBlockDataPicture;
import org.jaudiotagger.audio.flac.metadatablock.MetadataBlockHeader;
import org.jaudiotagger.audio.generic.AbstractTagCreator;
import org.jaudiotagger.tag.Tag;
import org.jaudiotagger.tag.flac.FlacTag;
import org.jaudiotagger.tag.vorbiscomment.VorbisCommentCreator;

import java.io.UnsupportedEncodingException;
import java.nio.ByteBuffer;
import java.util.ListIterator;
import java.util.logging.Logger;

/**
 * Create the tag data ready for writing to flac file
 */
public class FlacTagCreator extends AbstractTagCreator
{
    // Logger Object
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.flac");

    //TODO make an option
    public static final int DEFAULT_PADDING = 4000;

    private static final VorbisCommentCreator creator = new VorbisCommentCreator();

    /**
     * @param tag
     * @param paddingSize extra padding to be added
     * @return
     * @throws UnsupportedEncodingException
     */
    public ByteBuffer convert(Tag tag, int paddingSize) throws UnsupportedEncodingException
    {
        logger.config("Convert flac tag:padding:" + paddingSize);
        FlacTag flacTag = (FlacTag) tag;

        int tagLength = 0;
        ByteBuffer vorbiscomment = null;
        if (flacTag.getVorbisCommentTag() != null)
        {
            vorbiscomment = creator.convert(flacTag.getVorbisCommentTag());
            tagLength = vorbiscomment.capacity() + MetadataBlockHeader.HEADER_LENGTH;
        }
        for (MetadataBlockDataPicture image : flacTag.getImages())
        {
            tagLength += image.getBytes().limit() + MetadataBlockHeader.HEADER_LENGTH;
        }

        logger.config("Convert flac tag:taglength:" + tagLength);
        ByteBuffer buf = ByteBuffer.allocate(tagLength + paddingSize);

        MetadataBlockHeader vorbisHeader;
        //If there are other metadata blocks
        if (flacTag.getVorbisCommentTag() != null)
        {
            if ((paddingSize > 0) || (flacTag.getImages().size() > 0))
            {
                vorbisHeader = new MetadataBlockHeader(false, BlockType.VORBIS_COMMENT, vorbiscomment.capacity());
            }
            else
            {
                vorbisHeader = new MetadataBlockHeader(true, BlockType.VORBIS_COMMENT, vorbiscomment.capacity());
            }
            buf.put(vorbisHeader.getBytes());
            buf.put(vorbiscomment);
        }

        //Images
        ListIterator<MetadataBlockDataPicture> li = flacTag.getImages().listIterator();
        while (li.hasNext())
        {
            MetadataBlockDataPicture imageField = li.next();
            MetadataBlockHeader imageHeader;

            if (paddingSize > 0 || li.hasNext())
            {
                imageHeader = new MetadataBlockHeader(false, BlockType.PICTURE, imageField.getLength());
            }
            else
            {
                imageHeader = new MetadataBlockHeader(true, BlockType.PICTURE, imageField.getLength());
            }
            buf.put(imageHeader.getBytes());
            buf.put(imageField.getBytes());
        }

        //Padding
        logger.config("Convert flac tag at" + buf.position());
        if (paddingSize > 0)
        {
            int paddingDataSize = paddingSize - MetadataBlockHeader.HEADER_LENGTH;
            MetadataBlockHeader paddingHeader = new MetadataBlockHeader(true, BlockType.PADDING, paddingDataSize);
            MetadataBlockDataPadding padding = new MetadataBlockDataPadding(paddingDataSize);
            buf.put(paddingHeader.getBytes());
            buf.put(padding.getBytes());
        }
        buf.rewind();
        return buf;
    }
}
