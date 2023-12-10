package org.jaudiotagger.tag.reference;

/**
 * An enumeration of popular tagger applications
 *
 * <p>This is not meant to be a definitive list but is first attempt to document a list of taggers in order
 * for us to link nonstandard fields, and link nonstandard tagging to them
 */
public enum Tagger
{
    ITUNES(0,"iTunes"),
    MEDIAPLAYER(1,"Windows Media Player"),
    WINAMP(2,"Winamp"),
    MP3TAG(3,"Mp3 Tag"),
    MEDIA_MONKEY(4,"Media Monkey"),
    TAG_AND_RENAME(5,"Tag and Rename"),
    PICARD(6,"Picard"),
    JAIKOZ(7,"Jaikoz"),
    TAGSCANNER(8,"Tagscanner"),
    XIPH(9,"Xiph"),   //standards body rather than tagger xiph.org
    FOOBAR2000(10,"Foobar2000"),
    BEATUNES(11,"Beatunes"),
    SONGBIRD(12,"Songbird"),
    JRIVER(13,"JRiver"),
    GODFATHER(14,"The Godfather"),
    MUSICHI(15, "Musichi"),
    ;

    private int compatability;
    private String desc;

    Tagger(int compatability,String desc)
    {
        this.compatability=compatability;
        this.desc=desc;
    }

    public String toString()
    {
        return desc;
    }

}
