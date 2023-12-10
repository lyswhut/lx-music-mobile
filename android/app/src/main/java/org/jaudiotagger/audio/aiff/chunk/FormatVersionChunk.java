package org.jaudiotagger.audio.aiff.chunk;

import org.jaudiotagger.audio.aiff.AiffAudioHeader;
import org.jaudiotagger.audio.aiff.AiffUtil;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.Date;

/**
 * <p>
 *     The Format Version Chunk contains a date field to indicate the format rules for an
 *     AIFF-C specification. This will enable smoother future upgrades to this specification.
 * </p>
 * <p>
 *     ckID is always 'FVER'.
 * </p>
 * <p>
 *     {@code ckDataSize} is the size of the data portion of the chunk, in bytes. It does not
 *     include the 8 bytes used by ckID and ckDataSize. For this Chunk, ckDataSize has a value of 4.
 * </p>
 * <p>
 *     {@code timeStamp} indicates when the format version for the AIFF-C file was created.
 *     Units are the number of seconds since January 1, 1904. (This time convention is the one
 *     used by the Macintosh. For procedures that manipulate the time stamp, see The Operating
 *     System Utilities chapter in Inside Macintosh, vol II ). For a routine that will convert
 *     this to an Apple II GS/OS format time, please see Apple II File Type Note for filetype
 *     0xD8, aux type 0x0000.
 * </p>
 * <p>
 *     The Format Version Chunk is required. One and only one Format Version Chunk must appear in a FORM AIFC.
 * </p>
 */
public class FormatVersionChunk extends Chunk
{
    private AiffAudioHeader aiffHeader;

    /**
     * @param chunkHeader  The header for this chunk
     * @param chunkData  The buffer from which the AIFF data are being read
     * @param aiffAudioHeader The AiffTag into which information is stored
     */
    public FormatVersionChunk(final ChunkHeader chunkHeader, final ByteBuffer chunkData, final AiffAudioHeader aiffAudioHeader)
    {
        super(chunkData, chunkHeader);
        this.aiffHeader = aiffAudioHeader;
    }

    /**
     * Reads a chunk and extracts information.
     *
     * @return <code>false</code> if the chunk is structurally
     * invalid, otherwise <code>true</code>
     */
    public boolean readChunk() throws IOException
    {
        final long rawTimestamp = chunkData.getInt();
        // The timestamp is in seconds since January 1, 1904.
        // We must convert to Java time.
        final Date timestamp = AiffUtil.timestampToDate(rawTimestamp);
        aiffHeader.setTimestamp(timestamp);
        return true;
    }

}
