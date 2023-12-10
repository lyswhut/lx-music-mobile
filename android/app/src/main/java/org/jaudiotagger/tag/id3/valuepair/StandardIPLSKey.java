package org.jaudiotagger.tag.id3.valuepair;

import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;

/**
 * List of keys used by IPLS, TIPL and TMCL names that we map to individual keys, these are
 * handled differently to the remainder such as musicians and their instruments which is
 * essentially an infinite list.
 */
public enum StandardIPLSKey
{
    ENGINEER("engineer"),
    MIXER("mix"),
    DJMIXER("DJ-mix"),
    PRODUCER("producer"),
    ARRANGER("arranger"),;

    private String key;

    StandardIPLSKey(String key)
    {
        this.key = key;
    }

    public String getKey()
    {
        return key;
    }

    private static final Map<String, StandardIPLSKey> lookup = new HashMap<String, StandardIPLSKey>();

    static
    {
        for (StandardIPLSKey s : EnumSet.allOf(StandardIPLSKey.class))
        {
            lookup.put(s.getKey(), s);
        }
    }

    public static StandardIPLSKey get(String key)
    {
        return lookup.get(key);
    }

    public static boolean isKey(String key)
    {
        return get(key) != null;
    }
}