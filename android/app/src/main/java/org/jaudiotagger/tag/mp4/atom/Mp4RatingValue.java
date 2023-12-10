package org.jaudiotagger.tag.mp4.atom;

/**
 * List of valid values for the Rating (rtng) atom
 *
 * These are held as a byte field
 *
 * TODO:Is this only used in video
 */
public enum Mp4RatingValue
{
    CLEAN("Clean", 2),
    EXPLICIT("Explicit", 4);

    private String description;
    private int id;


    /**
     * @param description of value
     * @param id          used internally
     */
    Mp4RatingValue(String description, int id)
    {
        this.description = description;
        this.id = id;
    }

    /**
     * Return id used in the file
     *
     * @return id
     */
    public int getId()
    {
        return id;
    }

    /**
     * This is the value of the fieldname that is actually used to write mp4
     *
     * @return
     */
    public String getDescription()
    {
        return description;
    }


}
