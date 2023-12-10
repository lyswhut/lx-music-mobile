package org.jaudiotagger.audio.ogg;

/**
 * Vorbis Version
 *
 * Ordinal is used to map from internal representation
 */
public enum VorbisVersion
{
    VERSION_ONE("Ogg Vorbis v1");

    //The display name for this version
    private String displayName;


    VorbisVersion(String displayName)
    {
        this.displayName = displayName;
    }

    public String toString()
    {
        return displayName;
    }
}
