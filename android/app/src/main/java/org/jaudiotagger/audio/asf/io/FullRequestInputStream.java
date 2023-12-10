package org.jaudiotagger.audio.asf.io;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;

/**
 * This implementation repeatedly reads from the wrapped input stream until the
 * requested amount of bytes are read.<br>
 *
 * @author Christian Laireiter
 */
public class FullRequestInputStream extends FilterInputStream
{

    /**
     * Creates an instance.
     *
     * @param source stream to read from.
     */
    public FullRequestInputStream(final InputStream source)
    {
        super(source);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int read(final byte[] buffer) throws IOException
    {
        return read(buffer, 0, buffer.length);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int read(final byte[] buffer, final int off, final int len) throws IOException
    {
        int totalRead = 0;
        int read;
        while (totalRead < len)
        {
            read = super.read(buffer, off + totalRead, len - totalRead);
            if (read >= 0)
            {
                totalRead += read;
            }
            if (read == -1)
            {
                throw new IOException((len - totalRead) + " more bytes expected.");
            }
        }
        return totalRead;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public long skip(final long amount) throws IOException
    {
        long skipped = 0;
        int zeroSkipCnt = 0;
        long currSkipped;
        while (skipped < amount)
        {
            currSkipped = super.skip(amount - skipped);
            if (currSkipped == 0)
            {
                zeroSkipCnt++;
                if (zeroSkipCnt == 2)
                {
                    // If the skip value exceeds streams size, this and the
                    // number is extremely large, this can lead to a very long
                    // running loop.
                    break;
                }
            }
            skipped += currSkipped;
        }
        return skipped;
    }

}
