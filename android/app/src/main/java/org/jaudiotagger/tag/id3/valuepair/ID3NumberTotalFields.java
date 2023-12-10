package org.jaudiotagger.tag.id3.valuepair;

import org.jaudiotagger.tag.FieldKey;

import java.util.EnumSet;

/**
 * Created by Paul on 09/11/2016.
 */
public class ID3NumberTotalFields
{
    private static EnumSet<FieldKey> numberField = EnumSet.noneOf(FieldKey.class);
    private static EnumSet<FieldKey> totalField = EnumSet.noneOf(FieldKey.class);

    static
    {
        numberField.add(FieldKey.TRACK);
        numberField.add(FieldKey.DISC_NO);
        numberField.add(FieldKey.MOVEMENT_NO);

        totalField.add(FieldKey.TRACK_TOTAL);
        totalField.add(FieldKey.DISC_TOTAL);
        totalField.add(FieldKey.MOVEMENT_TOTAL);
    }

    public static boolean isNumber(FieldKey fieldKey)
    {
        return numberField.contains(fieldKey);
    }

    public static boolean isTotal(FieldKey fieldKey)
    {
        return totalField.contains(fieldKey);
    }

}
