package org.jaudiotagger.audio;

/**
 * Representation of AudioHeader
 *
 * <p>Contains info about the Audio Header
 */
public interface AudioHeader
{
    /**
     * @return the audio file type
     */
    public abstract String getEncodingType();

    /**
     * @return the ByteRate of the Audio, this is the total average amount of bytes of data sampled per second
     */
    public Integer getByteRate();



    /**
     * @return the BitRate of the Audio, this is the amount of kilobits of data sampled per second
     */
    public String getBitRate();

    /**
     * @return bitRate as a number, this is the amount of kilobits of data sampled per second
     */
    public long getBitRateAsNumber();


    /**
     *
     * @return length of the audio data in bytes, exactly what this means depends on the audio format
     *
     * TODO currently only used by Wav/Aiff/Flac/Mp4
     */
    public Long getAudioDataLength();


    /**
     *
     * @return the location in the file where the audio samples start
     *
     * TODO currently only used by Wav/Aiff/Flac/Mp4
     */
    public Long getAudioDataStartPosition();


    /**
     *
     * @return the location in the file where the audio samples end
     *
     * TODO currently only used by Wav/Aiff/Flac/Mp4
     */
    public Long getAudioDataEndPosition();


    /**
     * @return the Sampling rate, the number of samples taken per second
     */
    public String getSampleRate();

    /**
     * @return he Sampling rate, the number of samples taken per second
     */
    public int getSampleRateAsNumber();

    /**
     * @return the format
     */
    public String getFormat();

    /**
     * @return the number of channels (i.e 1 = Mono, 2 = Stereo)
     */
    public String getChannels();

    /**
     * @return if the sampling bitRate is variable or constant
     */
    public boolean isVariableBitRate();

    /**
     * @return track length in seconds
     */
    public int getTrackLength();

    /**
     *
     * @return track length as float
     */
    public double getPreciseTrackLength();

    /**
     * @return the number of bits in each sample
     */
    public int getBitsPerSample();

    /**
     *
     * @return if the audio codec is lossless or lossy
     */
    public boolean isLossless();

    /**
     *
     * @return the total number of samples, this can usually be used in conjunction with the
     * sample rate to determine the track duration
     */
    public Long getNoOfSamples();
}
