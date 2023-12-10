package org.jaudiotagger.audio.asf.io;

import java.io.IOException;
import java.io.OutputStream;

/**
 * This output stream wraps around another {@link OutputStream} and delegates
 * the write calls.<br>
 * Additionally all written bytes are counted and available by
 * {@link #getCount()}.
 *
 * @author Christian Laireiter
 */
public class CountingOutputstream extends OutputStream
{

    /**
     * Stores the amount of bytes written.
     */
    private long count = 0;

    /**
     * The stream to forward the write calls.
     */
    private final OutputStream wrapped;

    /**
     * Creates an instance which will delegate the write calls to the given
     * output stream.
     *
     * @param outputStream stream to wrap.
     */
    public CountingOutputstream(final OutputStream outputStream)
    {
        super();
        assert outputStream != null;
        this.wrapped = outputStream;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void close() throws IOException
    {
        this.wrapped.close();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void flush() throws IOException
    {
        this.wrapped.flush();
    }

    /**
     * @return the count
     */
    public long getCount()
    {
        return this.count;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final byte[] bytes) throws IOException
    {
        this.wrapped.write(bytes);
        this.count += bytes.length;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final byte[] bytes, final int off, final int len) throws IOException
    {
        this.wrapped.write(bytes, off, len);
        this.count += len;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void write(final int toWrite) throws IOException
    {
        this.wrapped.write(toWrite);
        this.count++;
    }

}
