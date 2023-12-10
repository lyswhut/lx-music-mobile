package org.jaudiotagger.audio.asf.data;

/**
 * This exception is used when a string was about to be interpreted as a GUID,
 * but did not match the format.<br>
 *
 * @author Christian Laireiter
 */
public class GUIDFormatException extends IllegalArgumentException
{

    /**
     *
     */
    private static final long serialVersionUID = 6035645678612384953L;

    /**
     * Creates an instance.
     *
     * @param detail detail message.
     */
    public GUIDFormatException(final String detail)
    {
        super(detail);
    }
}
