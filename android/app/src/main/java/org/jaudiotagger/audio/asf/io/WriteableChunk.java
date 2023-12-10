package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.GUID;

import java.io.IOException;
import java.io.OutputStream;

/**
 * Implementors can write themselves directly to an output stream, and have the
 * ability to tell the size they would need, as well as determine if they are
 * empty.<br>
 *
 * @author Christian Laireiter
 */
public interface WriteableChunk
{

    /**
     * This method calculates the total amount of bytes, the chunk would consume
     * in an ASF file.<br>
     *
     * @return amount of bytes the chunk would currently need in an ASF file.
     */
    long getCurrentAsfChunkSize();

    /**
     * Returns the GUID of the chunk.
     *
     * @return GUID of the chunk.
     */
    GUID getGuid();

    /**
     * <code>true</code> if it is not necessary to write the chunk into an ASF
     * file, since it contains no information.
     *
     * @return <code>true</code> if no useful data will be preserved.
     */
    boolean isEmpty();

    /**
     * Writes the chunk into the specified output stream, as ASF stream chunk.<br>
     *
     * @param out stream to write into.
     * @return amount of bytes written.
     * @throws IOException on I/O errors
     */
    long writeInto(OutputStream out) throws IOException;
}
