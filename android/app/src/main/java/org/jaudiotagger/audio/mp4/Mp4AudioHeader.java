package org.jaudiotagger.audio.mp4;

import org.jaudiotagger.audio.generic.GenericAudioHeader;
import org.jaudiotagger.audio.mp4.atom.Mp4EsdsBox;

/**
 * Store some additional attributes useful for Mp4s
 */
public class Mp4AudioHeader extends GenericAudioHeader
{
    private Mp4EsdsBox.Kind             kind;
    private Mp4EsdsBox.AudioProfile     profile;
    private String                      brand;


    public void setKind(Mp4EsdsBox.Kind kind)
    {
       this.kind=kind;
    }

    /**
     * @return kind
     */
    public Mp4EsdsBox.Kind getKind()
    {
        return kind;
    }

    /**
     * The key for the profile
     *
     * @param profile
     */
    public void setProfile(Mp4EsdsBox.AudioProfile profile)
    {
        this.profile=profile;
    }

    /**
     * @return audio profile
     */
    public Mp4EsdsBox.AudioProfile getProfile()
    {
        return profile;
    }

    /**
     * @param brand
     */
    public void setBrand(String brand)
    {
        this.brand=brand;
    }


    /**
     * @return brand
     */
    public String getBrand()
    {
        return brand;
    }


}
