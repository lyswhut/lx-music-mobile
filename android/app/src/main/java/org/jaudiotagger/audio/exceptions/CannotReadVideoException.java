package org.jaudiotagger.audio.exceptions;

/**
 * This exception should be thrown idf it appears the file is a video file, jaudiotagger only supports audio
 * files.
 */
public class CannotReadVideoException extends CannotReadException
{
    /**
     * Creates an instance.
     */
    public CannotReadVideoException()
    {
        super();
    }

    public CannotReadVideoException(Throwable ex)
    {
        super(ex);
    }

    /**
     * Creates an instance.
     *
     * @param message The message.
     */
    public CannotReadVideoException(String message)
    {
        super(message);
    }

    /**
     * Creates an instance.
     *
     * @param message The error message.
     * @param cause   The throwable causing this exception.
     */
    public CannotReadVideoException(String message, Throwable cause)
    {
        super(message, cause);
    }
}
