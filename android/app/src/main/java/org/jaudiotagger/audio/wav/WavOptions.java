package org.jaudiotagger.audio.wav;

/**
 * Wav files can store metadata within a LISTINFO chunk, an ID3 chunk, both or neither. When a WavTag is read
 * we read both tags if they exist, and if either don't exists we initialize WavTag with empty instances of
 * ID3Tag and/or InfoTag. But only one of the tags is accessible through the common interface and WavOptions
 * define which one this is.
 *
 * Here we define how we should interpret WavTag metadata when using the common interface, for example
 * if the default READ_ID3_ONLY option is used then methods on Tag interface will read and write to the ID3
 * chunk and ignore the Info Tag for the purposes of the active tag, but the info tag will still be read and
 * stored in the info tag.
 * If the READ_ID3_UNLESS_ONLY_INFO option is used the same applies as long
 * as the file already has an ID3 tag, if it does not but does have an INFO tag then methods apply to the INFO
 * chunk instead, so the Info tag becomes the active tag.
 *
 * Note the INFO tag can only store a small subset of the data that an ID3 tag can so the INFO options should only
 * be used to preserve compatibility with legacy applications that do not support ID3 chunks in Wav files.
 *
 * This option should be set using TagOptionSingleton.setWavOptions(), modifying this option will not affect
 * existing instances of WavTag
 *
 * The _AND_SYNC versions synchronize the active tag with any additional data that may be available in the nonactive tag
 * after the initial read. For example if the ID3 tag is the active tag but contains no artist tag, but the nonactive
 * Info tag does then the ID3 tag will be initialized with the same value for the artist field.
 */
public enum WavOptions
{
    READ_ID3_ONLY,
    READ_INFO_ONLY,
    READ_ID3_UNLESS_ONLY_INFO,
    READ_INFO_UNLESS_ONLY_ID3,
    READ_ID3_ONLY_AND_SYNC,
    READ_INFO_ONLY_AND_SYNC,
    READ_ID3_UNLESS_ONLY_INFO_AND_SYNC,
    READ_INFO_UNLESS_ONLY_ID3_AND_SYNC
    ;
}
