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
package org.jaudiotagger.audio.flac.metadatablock;

/**
 * Metadata Block
 *
 * <p>A FLAC bitstream consists of the "fLaC" marker at the beginning of the stream,
 * followed by a mandatory metadata block (called the STREAMINFO block), any number of other metadata blocks,
 * then the audio frames.
 */
public class MetadataBlock
{
    private MetadataBlockHeader mbh;
    private MetadataBlockData mbd;

    public MetadataBlock(MetadataBlockHeader mbh, MetadataBlockData mbd)
    {
        this.mbh = mbh;
        this.mbd = mbd;
    }

    public MetadataBlockHeader getHeader()
    {
        return mbh;
    }

    public MetadataBlockData getData()
    {
        return mbd;
    }

    public int getLength()
    {
        return MetadataBlockHeader.HEADER_LENGTH + mbh.getDataLength();
    }
}
