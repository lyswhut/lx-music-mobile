package org.jaudiotagger.audio.asf.io;

import org.jaudiotagger.audio.asf.data.Chunk;
import org.jaudiotagger.audio.asf.data.GUID;

import java.io.IOException;
import java.io.InputStream;

/**
 * A ChunkReader provides methods for reading an ASF chunk.<br>
 *
 * @author Christian Laireiter
 */
public interface ChunkReader
{

    /**
     * Tells whether the reader can fail to return a valid chunk.<br>
     * The current Use would be a modified version of {@link StreamChunkReader},
     * which is configured to only manage audio streams. However, the primary
     * GUID for audio and video streams is the same. So if a stream shows itself
     * to be a video stream, the reader would return <code>null</code>.<br>
     *
     * @return <code>true</code>, if further analysis of the chunk can show,
     * that the reader is not applicable, despite the header GUID
     * {@linkplain #getApplyingIds() identification} told it can handle
     * the chunk.
     */
    boolean canFail();

    /**
     * Returns the GUIDs identifying the types of chunk, this reader will parse.<br>
     *
     * @return the GUIDs identifying the types of chunk, this reader will parse.<br>
     */
    GUID[] getApplyingIds();

    /**
     * Parses the chunk.
     *
     * @param guid           the GUID of the chunks header, which is about to be read.
     * @param stream         source to read chunk from.<br>
     *                       No {@link GUID} is expected at the currents stream position.
     *                       The length of the chunk is about to follow.
     * @param streamPosition the position in stream, the chunk starts.<br>
     * @return the read chunk. (Mostly a subclass of {@link Chunk}).<br>
     * @throws IOException On I/O Errors.
     */
    Chunk read(GUID guid, InputStream stream, long streamPosition) throws IOException;
}
