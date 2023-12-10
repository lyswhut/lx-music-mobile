package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * This modifier manipulates an ASF header extension object.
 *
 * @author Christian Laireiter
 */
public class AsfExtHeaderModifier implements ChunkModifier
{

    /**
     * List of modifiers which are to be applied to contained chunks.
     */
    private final List<ChunkModifier> modifierList;

    /**
     * Creates an instance.<br>
     *
     * @param modifiers modifiers to apply.
     */
    public AsfExtHeaderModifier(final List<ChunkModifier> modifiers)
    {
        assert modifiers != null;
        this.modifierList = new ArrayList<ChunkModifier>(modifiers);
    }

    /**
     * Simply copies a chunk from <code>source</code> to
     * <code>destination</code>.<br>
     * The method assumes, that the GUID has already been read and will write
     * the provided one to the destination.<br>
     * The chunk length however will be read and used to determine the amount of
     * bytes to copy.
     *
     * @param guid        GUID of the current CHUNK.
     * @param source      source of an ASF chunk, which is to be located at the chunk
     *                    length field.
     * @param destination the destination to copy the chunk to.
     * @throws IOException on I/O errors.
     */
    private void copyChunk(final GUID guid, final InputStream source, final OutputStream destination) throws IOException
    {
        final long chunkSize = Utils.readUINT64(source);
        destination.write(guid.getBytes());
        Utils.writeUINT64(chunkSize, destination);
        Utils.copy(source, destination, chunkSize - 24);
    }

    /**
     * {@inheritDoc}
     */
    public boolean isApplicable(final GUID guid)
    {
        return GUID.GUID_HEADER_EXTENSION.equals(guid);
    }

    /**
     * {@inheritDoc}
     */
    public ModificationResult modify(final GUID guid, final InputStream source, final OutputStream destination) throws IOException
    {
        assert GUID.GUID_HEADER_EXTENSION.equals(guid);

        long difference = 0;
        final List<ChunkModifier> modders = new ArrayList<ChunkModifier>(this.modifierList);
        final Set<GUID> occuredGuids = new HashSet<GUID>();
        occuredGuids.add(guid);

        final BigInteger chunkLen = Utils.readBig64(source);
        final GUID reserved1 = Utils.readGUID(source);
        final int reserved2 = Utils.readUINT16(source);
        final long dataSize = Utils.readUINT32(source);

        assert dataSize == 0 || dataSize >= 24;
        assert chunkLen.subtract(BigInteger.valueOf(46)).longValue() == dataSize;

        /*
         * Stream buffer for the chunk list
         */
        final ByteArrayOutputStream bos = new ByteArrayOutputStream();
        /*
         * Stream which counts read bytes. Dirty but quick way of implementing
         * this.
         */
        final CountingInputStream cis = new CountingInputStream(source);

        while (cis.getReadCount() < dataSize)
        {
            // read GUID
            final GUID curr = Utils.readGUID(cis);
            boolean handled = false;
            for (int i = 0; i < modders.size() && !handled; i++)
            {
                if (modders.get(i).isApplicable(curr))
                {
                    final ModificationResult modRes = modders.get(i).modify(curr, cis, bos);
                    difference += modRes.getByteDifference();
                    occuredGuids.addAll(modRes.getOccuredGUIDs());
                    modders.remove(i);
                    handled = true;
                }
            }
            if (!handled)
            {
                occuredGuids.add(curr);
                copyChunk(curr, cis, bos);
            }
        }
        // Now apply the left modifiers.
        for (final ChunkModifier curr : modders)
        {
            // chunks, which were not in the source file, will be added to the
            // destination
            final ModificationResult result = curr.modify(null, null, bos);
            difference += result.getByteDifference();
            occuredGuids.addAll(result.getOccuredGUIDs());
        }
        destination.write(GUID.GUID_HEADER_EXTENSION.getBytes());
        Utils.writeUINT64(chunkLen.add(BigInteger.valueOf(difference)).longValue(), destination);
        destination.write(reserved1.getBytes());
        Utils.writeUINT16(reserved2, destination);
        Utils.writeUINT32(dataSize + difference, destination);
        destination.write(bos.toByteArray());
        return new ModificationResult(0, difference, occuredGuids);
    }

}
