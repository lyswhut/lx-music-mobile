package org.jaudiotagger.audio.asf.data;

import java.math.BigInteger;

/**
 * A factory for creating appropriate {@link MetadataContainer} objects upon
 * specified {@linkplain ContainerType container types}.<br>
 *
 * @author Christian Laireiter
 */
public final class MetadataContainerFactory
{

    /**
     * Factory instance.
     */
    private final static MetadataContainerFactory INSTANCE = new MetadataContainerFactory();

    /**
     * Returns an instance.
     *
     * @return an instance.
     */
    public static MetadataContainerFactory getInstance()
    {
        return INSTANCE;
    }

    /**
     * Hidden utility class constructor.
     */
    private MetadataContainerFactory()
    {
        // Hidden
    }

    /**
     * Creates an appropriate {@linkplain MetadataContainer container
     * implementation} for the given container type.
     *
     * @param type the type of container to get a container instance for.
     * @return appropriate container implementation.
     */
    public MetadataContainer createContainer(final ContainerType type)
    {
        return createContainer(type, 0, BigInteger.ZERO);
    }

    /**
     * Convenience Method for I/O. Same as
     * {@link #createContainer(ContainerType)}, but additionally assigns
     * position and size. (since a {@link MetadataContainer} is actually a
     * {@link Chunk}).
     *
     * @param type      The containers type.
     * @param pos       the position within the stream.
     * @param chunkSize the size of the container.
     * @return an appropriate container implementation with assigned size and
     * position.
     */
    public MetadataContainer createContainer(final ContainerType type, final long pos, final BigInteger chunkSize)
    {
        MetadataContainer result;
        if (type == ContainerType.CONTENT_DESCRIPTION)
        {
            result = new ContentDescription(pos, chunkSize);
        }
        else if (type == ContainerType.CONTENT_BRANDING)
        {
            result = new ContentBranding(pos, chunkSize);
        }
        else
        {
            result = new MetadataContainer(type, pos, chunkSize);
        }
        return result;
    }

    /**
     * Convenience method which calls {@link #createContainer(ContainerType)}
     * for each given container type.
     *
     * @param types types of the container which are to be created.
     * @return appropriate container implementations.
     */
    public MetadataContainer[] createContainers(final ContainerType[] types)
    {
        assert types != null;
        final MetadataContainer[] result = new MetadataContainer[types.length];
        for (int i = 0; i < result.length; i++)
        {
            result[i] = createContainer(types[i]);
        }
        return result;
    }

}
