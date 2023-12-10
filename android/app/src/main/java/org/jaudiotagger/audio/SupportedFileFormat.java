package org.jaudiotagger.audio;

/**
 * Files formats currently supported by Library.
 * Each enum value is associated with a file suffix (extension).
 */
public enum SupportedFileFormat
{
    OGG("ogg"),
    MP3("mp3"),
    FLAC("flac"),
    MP4("mp4"),
    M4A("m4a"),
    M4P("m4p"),
    WMA("wma"),
    WAV("wav"),
    RA("ra"),
    RM("rm"),
    M4B("m4b"),
    AIF("aif"),
    AIFF("aiff"),
    AIFC("aifc"),
    DSF("dsf");

    private String filesuffix;

    /** Constructor for internal use by this enum.
     */
    SupportedFileFormat(String filesuffix)
    {
        this.filesuffix = filesuffix;
    }

    /**
     *  Returns the file suffix (lower case without initial .) associated with the format.
     */
    public String getFilesuffix()
    {
        return filesuffix;
    }
}
