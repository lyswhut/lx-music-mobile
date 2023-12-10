package org.jaudiotagger.audio.dsf;

import org.jaudiotagger.audio.generic.GenericAudioHeader;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.IffHeaderChunk;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.channels.FileChannel;
import java.util.logging.Level;
import java.util.logging.Logger;

import static org.jaudiotagger.audio.dsf.DsdChunk.CHUNKSIZE_LENGTH;


/**
 * Created by Paul on 25/01/2016.
 */
public class FmtChunk
{
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.dsf.FmtChunk");

    public static final int FMT_CHUNK_MIN_DATA_SIZE_ = 40;
    private long chunkSizeLength;

    public static FmtChunk readChunkHeader(ByteBuffer dataBuffer)
    {
        String type = Utils.readFourBytesAsChars(dataBuffer);
        if (DsfChunkType.FORMAT.getCode().equals(type))
        {
            return new FmtChunk(dataBuffer);
        }
        return null;
    }

    private FmtChunk(ByteBuffer dataBuffer)
    {
        chunkSizeLength = dataBuffer.getLong();
    }

    public GenericAudioHeader readChunkData(DsdChunk dsd,FileChannel fc) throws IOException
    {
        long sizeExcludingChunkHeader = chunkSizeLength - (IffHeaderChunk.SIGNATURE_LENGTH + CHUNKSIZE_LENGTH);
        ByteBuffer audioData = Utils.readFileDataIntoBufferLE(fc, (int)sizeExcludingChunkHeader);
        return readAudioInfo(dsd, audioData);
    }

    /**
     * @param audioInfoChunk contains the bytes from "format version" up to "reserved"
     *                       fields
     * @return an empty {@link org.jaudiotagger.audio.generic.GenericAudioHeader} if audioInfoChunk has less
     * than 40 bytes, the read data otherwise. Never <code>null</code>.
     */
    @SuppressWarnings("unused")
    private GenericAudioHeader readAudioInfo(DsdChunk dsd, ByteBuffer audioInfoChunk)
    {
        GenericAudioHeader audioHeader = new GenericAudioHeader();
        if (audioInfoChunk.limit() < FMT_CHUNK_MIN_DATA_SIZE_)
        {
            logger.log(Level.WARNING, "Not enough bytes supplied for Generic audio header. Returning an empty one.");
            return audioHeader;
        }

        audioInfoChunk.order(ByteOrder.LITTLE_ENDIAN);
        int version = audioInfoChunk.getInt();
        int formatId =audioInfoChunk.getInt();
        int channelType =audioInfoChunk.getInt();
        int channelNumber = audioInfoChunk.getInt();
        int samplingFreqency = audioInfoChunk.getInt();
        int bitsPerSample =audioInfoChunk.getInt();
        long sampleCount = audioInfoChunk.getLong();
        int blocksPerSample = audioInfoChunk.getInt();

        audioHeader.setEncodingType("DSF");
        audioHeader.setBitRate(bitsPerSample * samplingFreqency * channelNumber);
        audioHeader.setBitsPerSample(bitsPerSample);
        audioHeader.setChannelNumber(channelNumber);
        audioHeader.setSamplingRate(samplingFreqency);
        audioHeader.setNoOfSamples(sampleCount);
        audioHeader.setPreciseLength((float) sampleCount / samplingFreqency);
        audioHeader.setVariableBitRate(false);
        logger.log(Level.FINE, "Created audio header: " + audioHeader);
        return audioHeader;
    }
}
