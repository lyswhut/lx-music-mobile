package org.jaudiotagger.tag;

/**
 * Thrown if the try and create a field with invalid data
 *
 * <p>For example if try and create an Mp4Field with type Byte using data that cannot be parsed as a number
 * then this exception will be thrown
 */
public class FieldDataInvalidException extends TagException
{
    /**
     * Creates a new KeyNotFoundException datatype.
     */
    public FieldDataInvalidException()
    {
    }

    /**
     * Creates a new KeyNotFoundException datatype.
     *
     * @param ex the cause.
     */
    public FieldDataInvalidException(Throwable ex)
    {
        super(ex);
    }

    /**
     * Creates a new KeyNotFoundException datatype.
     *
     * @param msg the detail message.
     */
    public FieldDataInvalidException(String msg)
    {
        super(msg);
    }

    /**
     * Creates a new KeyNotFoundException datatype.
     *
     * @param msg the detail message.
     * @param ex  the cause.
     */
    public FieldDataInvalidException(String msg, Throwable ex)
    {
        super(msg, ex);
    }
}
