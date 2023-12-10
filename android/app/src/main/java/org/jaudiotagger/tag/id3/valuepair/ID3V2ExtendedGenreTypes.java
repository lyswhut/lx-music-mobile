package org.jaudiotagger.tag.id3.valuepair;

/**
 * ID3V2 Genre list
 *
 * <p>These are additional genres added in the V2 Specification, they have a string key (RX,CV) rather than a
 * numeric key
 */
public enum ID3V2ExtendedGenreTypes
{
    RX("Remix"),
    CR("Cover");

    private String description;

    ID3V2ExtendedGenreTypes(String description)
    {
        this.description = description;
    }

    public String getDescription()
    {
        return description;
    }
}
