package org.jaudiotagger.audio.flac;

import org.jaudiotagger.audio.generic.GenericAudioHeader;

public class FlacAudioHeader extends GenericAudioHeader
{
    private String md5;

    public String getMd5()
    {
        return md5;
    }

    public void setMd5(String md5)
    {
        this.md5 = md5;
    }
}
