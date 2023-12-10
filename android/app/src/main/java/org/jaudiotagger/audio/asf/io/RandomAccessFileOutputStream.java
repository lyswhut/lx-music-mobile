package org.jaudiotagger.audio.asf.io;

import java.io.IOException;
import java.io.OutputStream;
import java.io.RandomAccessFile;

/**
 * Wraps a {@link RandomAccessFile} into an {@link OutputStream}.<br>
 *
 * @author Christian Laireiter
 */
public final class RandomAccessFileOutputStream extends OutputStream
{

    /**
     * the file to write to.
     */
    private final RandomAccessFile targetFile;

    /**
     * Creates an instance.<br>
     *
     * @param target file to write to.
     */
    public RandomAccessFileOutputStream(final RandomAccessFile target)
    {
        super();
        this.targetFile = target;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final byte[] bytes, final int off, final int len) throws IOException
    {
        this.targetFile.write(bytes, off, len);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final int toWrite) throws IOException
    {
        this.targetFile.write(toWrite);
    }

}
