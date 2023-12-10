package org.jaudiotagger.tag.reference;

import java.util.EnumSet;
import java.util.HashMap;

/**
 * Musical key used by the Key tagFieldKey
 *
 * It is not enforced but can be used to verify the Musical key according to the ID3 specification of the TKEY field
 */
public enum MusicalKey
{
    NOTE_A("A"),
    NOTE_B("B"),
    NOTE_C("C"),
    NOTE_D("D"),
    NOTE_E("E"),
    NOTE_F("F"),
    NOTE_G("G"),
    FLAT("b"),
    SHARP("#"),
    MINOR("m"),
    OFF_KEY("o");

    private String value;
    MusicalKey(String value)
    {
        this.value=value;
    }

    public String getValue()
    {
        return value;
    }

    private static final int MAX_KEY_LENGTH = 3;

    private final static HashMap<String, MusicalKey> groundKeyMap;
    private final static HashMap<String, MusicalKey> halfKeyMap;

    static
    {
        EnumSet<MusicalKey> groundKey = EnumSet.of(NOTE_A, NOTE_B, NOTE_C, NOTE_D, NOTE_E, NOTE_F, NOTE_G);
        groundKeyMap = new HashMap<String, MusicalKey>(MusicalKey.values().length);
        for (MusicalKey curr : groundKey)
        {
            groundKeyMap.put(curr.getValue(), curr);
        }
        EnumSet<MusicalKey> halfKey = EnumSet.of(FLAT, SHARP, MINOR);
        halfKeyMap = new HashMap<String, MusicalKey>(MusicalKey.values().length);
        for (MusicalKey curr : halfKey)
        {
            halfKeyMap.put(curr.getValue(), curr);
        }
    }

    public static boolean isValid(String musicalKey)
    {
        if(musicalKey==null || musicalKey.length()>MAX_KEY_LENGTH || musicalKey.length()==0)
        {
            return false;
        }


        if(musicalKey.length()==1)
        {
            if(musicalKey.equals(OFF_KEY.getValue()))
            {
                return true;
            }
        }

        if(!groundKeyMap.containsKey(musicalKey.substring(0,1)))
        {
            return false;
        }

        if(musicalKey.length()==2||musicalKey.length()==3)
        {
            if(!halfKeyMap.containsKey(musicalKey.substring(1,2)))
            {
                return false;
            }
        }

        if(musicalKey.length()==3)
        {
            if(!musicalKey.substring(2,3).equals(MINOR.getValue()))
            {
                return false;
            }
        }
        return true;
    }
}
