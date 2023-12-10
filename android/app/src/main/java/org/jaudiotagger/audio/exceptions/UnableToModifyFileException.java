package org.jaudiotagger.audio.exceptions;

import java.io.IOException;

/**
 * Should be thrown when unable to modify a file when it is expected it should be modifiable. For example because
 * you dont have permission to modify files in the folder that it is in.
 */
public class UnableToModifyFileException extends IOException
{
    public UnableToModifyFileException(String message)
    {
        super(message);
    }
}
