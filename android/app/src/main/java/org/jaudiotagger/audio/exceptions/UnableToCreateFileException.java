package org.jaudiotagger.audio.exceptions;

import java.io.IOException;

/**
 * Should be thrown when unable to create a file when it is expected it should be creatable. For example because
 * you dont have permission to write to the folder that it is in.
 */
public class UnableToCreateFileException extends IOException
{
    public UnableToCreateFileException(String message)
    {
        super(message);
    }
}
