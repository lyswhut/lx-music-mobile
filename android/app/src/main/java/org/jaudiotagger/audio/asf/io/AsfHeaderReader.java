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
package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.AsfHeader;
import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.*;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

/**
 * This <i>class </i> reads an ASF header out of an input stream an creates an
 * {@link org.jaudiotagger.audio.asf.data.AsfHeader} object if successful. <br>
 * For now only ASF ver 1.0 is supported, because ver 2.0 seems not to be used
 * anywhere. <br>
 * ASF headers contains other chunks. As of this other readers of current
 * <b>package </b> are called from within.
 *
 * @author Christian Laireiter
 */
public class AsfHeaderReader extends ChunkContainerReader<AsfHeader>
{
    /**
     * The GUID this reader {@linkplain #getApplyingIds() applies to}
     */
    private final static GUID[] APPLYING = {GUID.GUID_HEADER};

    /**
     * ASF reader configured to extract all information.
     */
    private final static AsfHeaderReader FULL_READER;
    /**
     * ASF reader configured to just extract information about audio streams.<br>
     * If the ASF file only contains one audio stream it works fine.<br>
     */
    private final static AsfHeaderReader INFO_READER;

    /**
     * ASF reader configured to just extract metadata information.<br>
     */
    private final static AsfHeaderReader TAG_READER;

    static
    {
        final List<Class<? extends ChunkReader>> readers = new ArrayList<Class<? extends ChunkReader>>();
        readers.add(FileHeaderReader.class);
        readers.add(StreamChunkReader.class);
        INFO_READER = new AsfHeaderReader(readers, true);
        readers.clear();
        readers.add(ContentDescriptionReader.class);
        readers.add(ContentBrandingReader.class);
        readers.add(LanguageListReader.class);
        readers.add(MetadataReader.class);
        /*
         * Create the header extension object readers with just content
         * description reader, extended content description reader, language
         * list reader and both metadata object readers.
         */
        final AsfExtHeaderReader extReader = new AsfExtHeaderReader(readers, true);
        final AsfExtHeaderReader extReader2 = new AsfExtHeaderReader(readers, true);
        TAG_READER = new AsfHeaderReader(readers, true);
        TAG_READER.setExtendedHeaderReader(extReader);
        readers.add(FileHeaderReader.class);
        readers.add(StreamChunkReader.class);
        readers.add(EncodingChunkReader.class);
        readers.add(EncryptionChunkReader.class);
        readers.add(StreamBitratePropertiesReader.class);
        FULL_READER = new AsfHeaderReader(readers, false);
        FULL_READER.setExtendedHeaderReader(extReader2);
    }

    /**
     * Creates a Stream that will read from the specified
     * {@link RandomAccessFile};<br>
     *
     * @param raf data source to read from.
     * @return a stream which accesses the source.
     */
    private static InputStream createStream(final RandomAccessFile raf)
    {
        return new FullRequestInputStream(new BufferedInputStream(new RandomAccessFileInputstream(raf)));
    }

    /**
     * This method extracts the full ASF-Header from the given file.<br>
     * If no header could be extracted <code>null</code> is returned. <br>
     *
     * @param file the ASF file to read.<br>
     * @return AsfHeader-Wrapper, or <code>null</code> if no supported ASF
     * header was found.
     * @throws IOException on I/O Errors.
     */
    public static AsfHeader readHeader(final File file) throws IOException
    {
        final InputStream stream = new FileInputStream(file);
        final AsfHeader result = FULL_READER.read(Utils.readGUID(stream), stream, 0);
        stream.close();
        return result;
    }

    /**
     * This method tries to extract a full ASF-header out of the given stream. <br>
     * If no header could be extracted <code>null</code> is returned. <br>
     *
     * @param file File which contains the ASF header.
     * @return AsfHeader-Wrapper, or <code>null</code> if no supported ASF
     * header was found.
     * @throws IOException Read errors
     */
    public static AsfHeader readHeader(final RandomAccessFile file) throws IOException
    {
        final InputStream stream = createStream(file);
        return FULL_READER.read(Utils.readGUID(stream), stream, 0);
    }

    /**
     * This method tries to extract an ASF-header out of the given stream, which
     * only contains information about the audio stream.<br>
     * If no header could be extracted <code>null</code> is returned. <br>
     *
     * @param file File which contains the ASF header.
     * @return AsfHeader-Wrapper, or <code>null</code> if no supported ASF
     * header was found.
     * @throws IOException Read errors
     */
    public static AsfHeader readInfoHeader(final RandomAccessFile file) throws IOException
    {
        final InputStream stream = createStream(file);
        return INFO_READER.read(Utils.readGUID(stream), stream, 0);
    }

    /**
     * This method tries to extract an ASF-header out of the given stream, which
     * only contains metadata.<br>
     * If no header could be extracted <code>null</code> is returned. <br>
     *
     * @param file File which contains the ASF header.
     * @return AsfHeader-Wrapper, or <code>null</code> if no supported ASF
     * header was found.
     * @throws IOException Read errors
     */
    public static AsfHeader readTagHeader(final RandomAccessFile file) throws IOException
    {
        final InputStream stream = createStream(file);
        return TAG_READER.read(Utils.readGUID(stream), stream, 0);
    }

    /**
     * Creates an instance of this reader.
     *
     * @param toRegister    The chunk readers to utilize.
     * @param readChunkOnce if <code>true</code>, each chunk type (identified by chunk
     *                      GUID) will handled only once, if a reader is available, other
     *                      chunks will be discarded.
     */
    public AsfHeaderReader(final List<Class<? extends ChunkReader>> toRegister, final boolean readChunkOnce)
    {
        super(toRegister, readChunkOnce);
    }

    /**
     * {@inheritDoc}
     */
    public boolean canFail()
    {
        return false;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected AsfHeader createContainer(final long streamPosition, final BigInteger chunkLength, final InputStream stream) throws IOException
    {
        final long chunkCount = Utils.readUINT32(stream);
        /*
         * 2 reserved bytes. first should be equal to 0x01 and second 0x02. ASF
         * specification suggests to not read the content if second byte is not
         * 0x02.
         */
        if (stream.read() != 1)
        {
            throw new IOException("No ASF"); //$NON-NLS-1$
        }
        if (stream.read() != 2)
        {
            throw new IOException("No ASF"); //$NON-NLS-1$
        }
        /*
         * Creating the resulting object
         */
        return new AsfHeader(streamPosition, chunkLength, chunkCount);
    }

    /**
     * {@inheritDoc}
     */
    public GUID[] getApplyingIds()
    {
        return APPLYING.clone();
    }

    /**
     * Sets the {@link AsfExtHeaderReader}, which is to be used, when an header
     * extension object is found.
     *
     * @param extReader header extension object reader.
     */
    public void setExtendedHeaderReader(final AsfExtHeaderReader extReader)
    {
        for (final GUID curr : extReader.getApplyingIds())
        {
            this.readerMap.put(curr, extReader);
        }
    }

}