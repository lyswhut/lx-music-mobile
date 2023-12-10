package org.jaudiotagger.tag.id3.valuepair;

import org.jaudiotagger.tag.datatype.AbstractIntStringValuePair;

/**
 * Content Type used by Sysnchronised Lyrics Frame (SYLT)
 */
public class SynchronisedLyricsContentType extends AbstractIntStringValuePair
{
    private static SynchronisedLyricsContentType eventTimingTypes;

    public static SynchronisedLyricsContentType getInstanceOf()
    {
        if (SynchronisedLyricsContentType.eventTimingTypes == null)
        {
            SynchronisedLyricsContentType.eventTimingTypes = new SynchronisedLyricsContentType();
        }
        return SynchronisedLyricsContentType.eventTimingTypes;
    }

    public static final int CONTENT_KEY_FIELD_SIZE = 1;

    private SynchronisedLyricsContentType()
    {
        idToValue.put(0x00, "other");
        idToValue.put(0x01, "lyrics");
        idToValue.put(0x02, "text transcription");
        idToValue.put(0x03, "movement/part name");
        idToValue.put(0x04, "events");
        idToValue.put(0x05, "chord");
        idToValue.put(0x06, "trivia");
        idToValue.put(0x07, "URLs to webpages");
        idToValue.put(0x08, "URLs to images");
        createMaps();
    }
}
