package org.jaudiotagger.audio.wav;

/**
 * Wav files can store metadata within a LISTINFO chunk, an ID3 chunk, both or neither.
 *
 * When saving both we can define in which order they should be saved, the correct order
 * may be required to better support data in legacy applications
 */
public enum WavSaveOrder
{
    INFO_THEN_ID3,
    ID3_THEN_INFO
    ;
}
