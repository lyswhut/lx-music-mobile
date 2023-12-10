package org.jaudiotagger.audio.exceptions;

/**
 * Thrown if when trying to read box id just finds nulls
 * Normally an error, but if occurs at end of file we allow it
 */
public class NullBoxIdException extends RuntimeException
{
    public NullBoxIdException(String message)
    {
        super(message);
    }
}
