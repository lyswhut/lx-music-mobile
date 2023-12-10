package org.jaudiotagger.tag.reference;

/**
 * The PERFORMER field is formatted differently depending on whether writing to the ID3 format that utilises multiple fields or the simple
 * TEXT/VALUE fields used by VorbisComments and similar formats, the role is always set to lowercase.
 */
public class PerformerHelper
{
    public static String formatForId3(String artist, String attributes)
    {
        return attributes.toLowerCase() + '\0' + artist;
    }

    public static String formatForNonId3(String artist, String attributes)
    {
        return artist + " (" + attributes.toLowerCase() + ")";
    }
}
