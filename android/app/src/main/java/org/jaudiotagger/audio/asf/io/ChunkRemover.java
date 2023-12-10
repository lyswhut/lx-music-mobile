package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.GUID;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.Set;

/**
 * This {@link ChunkModifier} implementation is meant to remove selected chunks.<br>
 *
 * @author Christian Laireiter
 */
@SuppressWarnings({"ManualArrayToCollectionCopy"})
public class ChunkRemover implements ChunkModifier
{

    /**
     * Stores the GUIDs, which are about to be removed by this modifier.<br>
     */
    private final Set<GUID> toRemove;

    /**
     * Creates an instance, for removing selected chunks.<br>
     *
     * @param guids the GUIDs which are about to be removed by this modifier.
     */
    public ChunkRemover(final GUID... guids)
    {
        this.toRemove = new HashSet<GUID>();
        for (final GUID current : guids)
        {
            this.toRemove.add(current);
        }
    }

    /**
     * {@inheritDoc}
     */
    public boolean isApplicable(final GUID guid)
    {
        return this.toRemove.contains(guid);
    }

    /**
     * {@inheritDoc}
     */
    public ModificationResult modify(final GUID guid, final InputStream source, final OutputStream destination) throws IOException
    {
        ModificationResult result;
        if (guid == null)
        {
            // Now a chunk should be added, however, this implementation is for
            // removal.
            result = new ModificationResult(0, 0);
        }
        else
        {
            assert isApplicable(guid);
            // skip the chunk length minus 24 bytes for the already read length
            // and the guid.
            final long chunkLen = Utils.readUINT64(source);
            source.skip(chunkLen - 24);
            result = new ModificationResult(-1, -1 * chunkLen, guid);
        }
        return result;
    }

}
