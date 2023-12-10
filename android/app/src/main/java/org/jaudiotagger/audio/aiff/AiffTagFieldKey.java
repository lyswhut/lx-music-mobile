package org.jaudiotagger.audio.aiff;

/**
 * Enum for AIFF fields that don't have obvious matches in FieldKey
 */
public enum AiffTagFieldKey
{
    TIMESTAMP("TIMESTAMP");

    private String fieldName;

    AiffTagFieldKey(String fieldName)
    {
        this.fieldName = fieldName;
    }

    public String getFieldName()
    {
        return fieldName;
    }
}
