package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.AsfExtendedHeader;
import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.util.List;

/**
 * This reader reads an ASF header extension object from an {@link InputStream}
 * and creates an {@link AsfExtendedHeader} object.<br>
 *
 * @author Christian Laireiter
 */
public class AsfExtHeaderReader extends ChunkContainerReader<AsfExtendedHeader>
{

    /**
     * The GUID this reader {@linkplain #getApplyingIds() applies to}
     */
    private final static GUID[] APPLYING = {GUID.GUID_HEADER_EXTENSION};

    /**
     * Creates a reader instance, which only utilizes the given list of chunk
     * readers.<br>
     *
     * @param toRegister    List of {@link ChunkReader} class instances, which are to be
     *                      utilized by the instance.
     * @param readChunkOnce if <code>true</code>, each chunk type (identified by chunk
     *                      GUID) will handled only once, if a reader is available, other
     *                      chunks will be discarded.
     */
    public AsfExtHeaderReader(final List<Class<? extends ChunkReader>> toRegister, final boolean readChunkOnce)
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
    protected AsfExtendedHeader createContainer(final long streamPosition, final BigInteger chunkLength, final InputStream stream) throws IOException
    {
        Utils.readGUID(stream); // First reserved field (should be a specific
        // GUID.
        Utils.readUINT16(stream); // Second reserved field (should always be 6)
        final long extensionSize = Utils.readUINT32(stream);
        assert extensionSize == 0 || extensionSize >= 24;
        assert chunkLength.subtract(BigInteger.valueOf(46)).longValue() == extensionSize;
        return new AsfExtendedHeader(streamPosition, chunkLength);
    }

    /**
     * {@inheritDoc}
     */
    public GUID[] getApplyingIds()
    {
        return APPLYING.clone();
    }

}
