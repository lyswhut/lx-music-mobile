package org.jaudiotagger.audio.aiff.chunk;

import org.jaudiotagger.audio.aiff.AiffAudioHeader;
import org.jaudiotagger.audio.aiff.AiffType;
import org.jaudiotagger.audio.aiff.AiffUtil;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.Chunk;
import org.jaudiotagger.audio.iff.ChunkHeader;

import java.io.IOException;
import java.nio.ByteBuffer;

/**
 The Common Chunk describes fundamental parameters of the waveform data such as sample rate,
 bit resolution, and how many channels of digital audio are stored in the FORM AIFF.
 */
public class CommonChunk extends Chunk
{
    private AiffAudioHeader aiffHeader;

    /**
     *
     * @param hdr
     * @param chunkData
     * @param aiffAudioHeader
     */
    public  CommonChunk(ChunkHeader hdr, ByteBuffer chunkData, AiffAudioHeader aiffAudioHeader)
    {
        super(chunkData, hdr);
        aiffHeader = aiffAudioHeader;
    }


    @Override
    public boolean readChunk() throws IOException
    {

        int numChannels         = Utils.u(chunkData.getShort());
        long numSamples         = chunkData.getInt();
        int bitsPerSample       = Utils.u(chunkData.getShort());
        double sampleRate       = AiffUtil.read80BitDouble(chunkData);
        //Compression format, but not necessarily compressed
        String compressionType;
        String compressionName;
        if (aiffHeader.getFileType() == AiffType.AIFC)
        {
            // This is a rather special case, but testing did turn up
            // a file that misbehaved in this way.
            if (chunkData.remaining()==0)
            {
                return false;
            }
            compressionType = Utils.readFourBytesAsChars(chunkData);
            if (compressionType.equals(AiffCompressionType.SOWT.getCode()))
            {
                aiffHeader.setEndian(AiffAudioHeader.Endian.LITTLE_ENDIAN);
            }
            compressionName = Utils.readPascalString(chunkData);
            // Proper handling of compression type should depend
            // on whether raw output is set
            if (compressionType != null)
            {
                //Is it a known compression type
                AiffCompressionType act = AiffCompressionType.getByCode(compressionType);
                if (act != null)
                {
                    compressionName = act.getCompression();
                    aiffHeader.setLossless(act.isLossless());
                    // we assume that the bitrate is not variable, if there is no compression
                    if (act == AiffCompressionType.NONE) {
                        aiffHeader.setVariableBitRate(false);
                    }
                }
                else
                {
                    // We don't know compression type, so we have to assume lossy compression as we know we are using AIFC format
                    aiffHeader.setLossless(false);
                }

                if (compressionName.isEmpty())
                {
                    aiffHeader.setEncodingType(compressionType);
                }
                else
                {
                    aiffHeader.setEncodingType(compressionName);
                }
            }
        }
        //Must be lossless
        else
        {
            aiffHeader.setLossless(true);
            aiffHeader.setEncodingType(AiffCompressionType.NONE.getCompression());
            // regular AIFF has no variable bit rate AFAIK
            aiffHeader.setVariableBitRate(false);
        }

        aiffHeader.setBitsPerSample(bitsPerSample);
        aiffHeader.setSamplingRate((int) sampleRate);
        aiffHeader.setChannelNumber(numChannels);
        aiffHeader.setPreciseLength((numSamples / sampleRate));
        aiffHeader.setNoOfSamples(numSamples);
        return true;
    }

}
