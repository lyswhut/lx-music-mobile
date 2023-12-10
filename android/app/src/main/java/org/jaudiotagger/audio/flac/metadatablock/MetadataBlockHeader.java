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

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.logging.ErrorMessage;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.logging.Logger;

/**
 * Metadata Block Header
 */
public class MetadataBlockHeader
{
    public static final int BLOCK_TYPE_LENGTH   = 1;
    public static final int BLOCK_LENGTH        = 3;
    public static final int HEADER_LENGTH       = BLOCK_TYPE_LENGTH + BLOCK_LENGTH;

    private boolean isLastBlock;
    private int dataLength;
    private byte[] bytes;
    private BlockType blockType;

    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.flac");
    /**
     * Create header by reading from file
     *
     * @param fc
     * @return
     * @throws IOException
     */
    public static MetadataBlockHeader readHeader(FileChannel fc) throws CannotReadException, IOException
    {
        ByteBuffer rawdata = ByteBuffer.allocate(HEADER_LENGTH);
        int bytesRead = fc.read(rawdata);
        if (bytesRead < HEADER_LENGTH)
        {
            throw new IOException("Unable to read required number of databytes read:" + bytesRead + ":required:" + HEADER_LENGTH);
        }
        rawdata.rewind();
        return new MetadataBlockHeader(rawdata);
    }

    public String toString()
    {
        return "BlockType:"+blockType + " DataLength:"+dataLength + " isLastBlock:"+isLastBlock;
    }

    /**
     * Construct header by reading bytes
     *
     * @param rawdata
     */
    public MetadataBlockHeader(ByteBuffer rawdata) throws CannotReadException
    {
        isLastBlock = ((rawdata.get(0) & 0x80) >>> 7) == 1;
        int type = rawdata.get(0) & 0x7F;
        if (type < BlockType.values().length)
        {
            blockType = BlockType.values()[type];
            dataLength = (u(rawdata.get(1)) << 16) + (u(rawdata.get(2)) << 8) + (u(rawdata.get(3)));
            bytes = new byte[HEADER_LENGTH];
            for (int i = 0; i < HEADER_LENGTH; i++)
            {
                bytes[i] = rawdata.get(i);
            }
        }
        else
        {
            throw new CannotReadException(ErrorMessage.FLAC_NO_BLOCKTYPE.getMsg(type));
        }
    }

    /**
     * Construct a new header in order to write metadatablock to file
     *
     * @param isLastBlock
     * @param blockType
     * @param dataLength
     */
    public MetadataBlockHeader(boolean isLastBlock, BlockType blockType, int dataLength)
    {
        ByteBuffer rawdata = ByteBuffer.allocate(HEADER_LENGTH);
        this.blockType = blockType;
        this.isLastBlock = isLastBlock;
        this.dataLength = dataLength;

        byte type;
        if (isLastBlock)
        {
            type = (byte) (0x80 | blockType.getId());
        }
        else
        {
            type = (byte) blockType.getId();
        }
        rawdata.put(type);

        //Size is 3Byte BigEndian int
        rawdata.put((byte) ((dataLength & 0xFF0000) >>> 16));
        rawdata.put((byte) ((dataLength & 0xFF00) >>> 8));
        rawdata.put((byte) (dataLength & 0xFF));

        bytes = new byte[HEADER_LENGTH];
        for (int i = 0; i < HEADER_LENGTH; i++)
        {
            bytes[i] = rawdata.get(i);
        }
    }

    private int u(int i)
    {
        return i & 0xFF;
    }

    public int getDataLength()
    {
        return dataLength;
    }

    public BlockType getBlockType()
    {
        return blockType;
    }

    public boolean isLastBlock()
    {
        return isLastBlock;
    }

    public byte[] getBytesWithoutIsLastBlockFlag()
    {
        bytes[0] = (byte) (bytes[0] & 0x7F);
        return bytes;
    }

    public byte[] getBytes()
    {
        return bytes;
    }
}
