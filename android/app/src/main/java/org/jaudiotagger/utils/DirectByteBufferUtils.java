package org.jaudiotagger.utils;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.Buffer;
import java.nio.ByteBuffer;
import java.nio.MappedByteBuffer;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Utilities for direct {@link ByteBuffer}s.
 * <p/>
 * The release method was taken from research in the following places:
 * <ul>
 * <li>http://bugs.java.com/view_bug.do?bug_id=4724038</li>
 * <li>http://stackoverflow.com/questions/2972986/how-to-unmap-a-file-from-memory-mapped-using-filechannel-in-java</li>
 * <li>https://bitbucket.org/vladimir.dolzhenko/gflogger/src/366fd4ee0689/core/src/main/java/org/gflogger/util/DirectBufferUtils.java</li>
 * <li>https://sourceforge.net/p/tuer/code/HEAD/tree/pre_beta/src/main/java/engine/misc/DeallocationHelper.java</li>
 * </ul>
 *
 * @author gravelld
 */
public class DirectByteBufferUtils
{

    public static final Logger LOGGER = Logger.getLogger(DirectByteBufferUtils.class.getName());

    private static ReleaseStrategy releaseStrategy;

    static
    {
        releaseStrategy = decideReleaseStrategy();
    }

    private interface ReleaseStrategy
    {

        /**
         * Make a best-effort attempt to release the {@link ByteBuffer}
         *
         * @param bb
         */
        void release(Buffer bb);
    }

    private final static class OpenJdkReleaseStrategy implements ReleaseStrategy
    {

        private static final ReleaseStrategy INSTANCE = new OpenJdkReleaseStrategy();
        private static final Method cleanerMethod;
        private static final Method cleanMethod;
        private static final Method viewedBufferMethod;

        static
        {
            cleanerMethod = loadMethod("sun.nio.ch.DirectBuffer", "cleaner");
            cleanMethod = loadMethod("sun.misc.Cleaner", "clean");
            Method vbMethod = loadMethod("sun.nio.ch.DirectBuffer", "viewedBuffer");
            if (vbMethod == null)
            {
                // They changed the name in Java 7 (???)
                vbMethod = loadMethod("sun.nio.ch.DirectBuffer", "attachment");
            }
            viewedBufferMethod = vbMethod;
        }

        private OpenJdkReleaseStrategy()
        {
        }

        @Override
        public void release(Buffer bb)
        {
            try
            {
                final Object cleaner = cleanerMethod.invoke(bb);
                if (cleaner != null)
                {
                    cleanMethod.invoke(cleaner);
                }
                else
                {
                    final Object viewedBuffer = viewedBufferMethod.invoke(bb);
                    if (viewedBuffer != null)
                    {
                        release((Buffer) viewedBuffer);
                    }
                    else
                    {
                        LOGGER.log(Level.WARNING, "Can't release direct buffer as neither cleaner nor viewedBuffer were available on:" + bb.getClass());
                    }
                }
            }
            catch (IllegalAccessException e)
            {
                LOGGER.log(Level.WARNING, "Authorisation failed to invoke release on: " + bb, e);
            }
            catch (InvocationTargetException e)
            {
                LOGGER.log(Level.WARNING, "Failed to release: " + bb, e);
            }
        }

    }

    private final static class AndroidReleaseStrategy implements ReleaseStrategy
    {

        private static final ReleaseStrategy INSTANCE = new AndroidReleaseStrategy();

        private static final Method freeMethod;

        static
        {
            freeMethod = loadMethod("java.nio.DirectByteBuffer", "free");
        }

        private AndroidReleaseStrategy()
        {
        }

        @Override
        public void release(Buffer bb)
        {

            if (freeMethod != null)
            {
                try
                {
                    freeMethod.invoke(bb);
                }
                catch (IllegalAccessException e)
                {
                    LOGGER.log(Level.WARNING, "Authorisation failed to invoke release on: " + bb, e);
                }
                catch (InvocationTargetException e)
                {
                    LOGGER.log(Level.WARNING, "Failed to release: " + bb, e);
                }
            }
            else
            {
                LOGGER.log(Level.WARNING, "Can't release direct buffer as free method weren't available on: " + bb);
            }
        }

    }

    private final static class UnsupportedJvmReleaseStrategy implements ReleaseStrategy
    {
        private static final ReleaseStrategy INSTANCE = new UnsupportedJvmReleaseStrategy();

        private UnsupportedJvmReleaseStrategy()
        {
        }

        @Override
        public void release(Buffer bb)
        {
            LOGGER.log(Level.WARNING, "Can't release direct buffer as this JVM is unsupported.");
        }
    }

    /**
     * Decide which ReleaseStrategy to use, depending on the JVM
     *
     * @return
     */
    private static ReleaseStrategy decideReleaseStrategy()
    {

        final String javaVendor = System.getProperty("java.vendor");

        if (javaVendor.equals("Sun Microsystems Inc.") || javaVendor.equals("Oracle Corporation"))
        {
            return OpenJdkReleaseStrategy.INSTANCE;
        }
        else if (javaVendor.equals("The Android Project"))
        {
            return AndroidReleaseStrategy.INSTANCE;
        }
        else
        {
            LOGGER.log(Level.WARNING, "Won't be able to release direct buffers as this JVM is unsupported: " + javaVendor);
            return UnsupportedJvmReleaseStrategy.INSTANCE;
        }
    }

    private static Method loadMethod(final String className, final String methodName)
    {
        try
        {
            final Class<?> clazz = Class.forName(className);
            final Method method = clazz.getMethod(methodName);
            method.setAccessible(true);
            return method;
        }
        catch (NoSuchMethodException ex)
        {
            return null; // the method was not found
        }
        catch (SecurityException ex)
        {
            return null; // setAccessible not allowed by security policy
        }
        catch (ClassNotFoundException ex)
        {
            return null; // the direct buffer implementation was not found
        }
    }

    /**
     * Direct {@link ByteBuffer}s are stored in system memory, and released when garbage collection occurs
     * and the buffer is deemed to be unreachable, following vanilla garbage collection procedures. At that
     * point, a special finalizer, "Cleaner" runs to de-allocate the system memory (and in the case of
     * {@link MappedByteBuffer}s, unmap the file).
     * <p/>
     * However, if garbage collection does not occur, the system memory remains taken, and the {@link MappedByteBuffer}
     * (if applicable) remains mapped, meaning system level operations cannot occur in other processes.
     * <p/>
     * This method seeks to release a direct {@link ByteBuffer} early by calling well known reflective code
     * in a best-attempt fashion. In the case that this reflective code is not present, the method
     * finishes with a log message, and normal Java practice takes over; i.e. the buffer is not released
     * and if it's a {@link MappedByteBuffer} the file is not unmapped, until later GC occurs or the
     * JVM is terminated.
     *
     * @param bb
     * @throws NullPointerException     If bb is null.
     * @throws IllegalArgumentException If bb is not a "direct" {@link ByteBuffer}
     */
    public static void release(Buffer bb)
    {

        if (bb == null)
        {
            throw new NullPointerException(ByteBuffer.class.getSimpleName() + " should not be null");
        }
        if (!bb.isDirect())
        {
            throw new IllegalArgumentException(bb.getClass().getName() + " is not direct.");
        }

        releaseStrategy.release(bb);
    }

}
