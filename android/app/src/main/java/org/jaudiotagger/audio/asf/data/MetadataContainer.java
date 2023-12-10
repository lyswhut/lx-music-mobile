package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.io.WriteableChunk;
import org.jaudiotagger.audio.asf.util.Utils;

import java.io.IOException;
import java.io.OutputStream;
import java.math.BigInteger;
import java.util.*;

/**
 * This structure represents the &quot;Metadata Object&quot;,&quot;Metadata
 * Library Object&quot; and &quot;Extended Content Description&quot;.<br>
 *
 * @author Christian Laireiter
 */
public class MetadataContainer extends Chunk implements WriteableChunk
{

    /**
     * This class is used to uniquely identify an enclosed descriptor by its
     * name, language index and stream number.<br>
     * The type of the descriptor is ignored, since it just specifies the data
     * content.
     *
     * @author Christian Laireiter
     */
    private final static class DescriptorPointer
    {

        /**
         * The represented descriptor.
         */
        private MetadataDescriptor desc;

        /**
         * Creates an instance.
         *
         * @param descriptor the metadata descriptor to identify.
         */
        public DescriptorPointer(final MetadataDescriptor descriptor)
        {
            setDescriptor(descriptor);
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public boolean equals(final Object obj)
        {
            boolean result = obj == this;
            if (obj instanceof DescriptorPointer && !result)
            {
                final MetadataDescriptor other = ((DescriptorPointer) obj).desc;
                result = this.desc.getName().equals(other.getName());
                result &= this.desc.getLanguageIndex() == other.getLanguageIndex();
                result &= this.desc.getStreamNumber() == other.getStreamNumber();
            }
            return result;
        }

        /**
         * {@inheritDoc}
         */
        @Override
        public int hashCode()
        {
            int hashCode;
            hashCode = this.desc.getName().hashCode();
            hashCode = hashCode * 31 + this.desc.getLanguageIndex();
            hashCode = hashCode * 31 + this.desc.getStreamNumber();
            return hashCode;
        }

        /**
         * Sets the descriptor to identify.
         *
         * @param descriptor the descriptor to identify.
         * @return this instance.
         */
        protected DescriptorPointer setDescriptor(final MetadataDescriptor descriptor)
        {
            assert descriptor != null;
            this.desc = descriptor;
            return this;
        }
    }

    /**
     * Looks up all {@linkplain ContainerType#getContainerGUID() guids} and
     * returns the matching type.
     *
     * @param guid GUID to look up
     * @return matching container type.
     * @throws IllegalArgumentException if no container type matches
     */
    private static ContainerType determineType(final GUID guid) throws IllegalArgumentException
    {
        assert guid != null;
        ContainerType result = null;
        for (final ContainerType curr : ContainerType.values())
        {
            if (curr.getContainerGUID().equals(guid))
            {
                result = curr;
                break;
            }
        }
        if (result == null)
        {
            throw new IllegalArgumentException("Unknown metadata container specified by GUID (" + guid.toString() + ")");
        }
        return result;
    }

    /**
     * stores the represented container type.<br>
     */
    private final ContainerType containerType;

    /**
     * Stores the descriptors.
     */
    private final Map<DescriptorPointer, List<MetadataDescriptor>> descriptors = new Hashtable<DescriptorPointer, List<MetadataDescriptor>>();

    /**
     * for performance reasons this instance is used to look up existing
     * descriptors in {@link #descriptors}.<br>
     */
    private final DescriptorPointer perfPoint = new DescriptorPointer(new MetadataDescriptor(""));

    /**
     * Creates an instance.
     *
     * @param type determines the type of the container
     */
    public MetadataContainer(final ContainerType type)
    {
        this(type, 0, BigInteger.ZERO);
    }

    /**
     * Creates an instance.
     *
     * @param type determines the type of the container
     * @param pos  location in the ASF file
     * @param size size of the chunk.
     */
    public MetadataContainer(final ContainerType type, final long pos, final BigInteger size)
    {
        super(type.getContainerGUID(), pos, size);
        this.containerType = type;
    }

    /**
     * Creates an instance.
     *
     * @param containerGUID the containers GUID
     * @param pos           location in the ASF file
     * @param size          size of the chunk.
     */
    public MetadataContainer(final GUID containerGUID, final long pos, final BigInteger size)
    {
        this(determineType(containerGUID), pos, size);
    }

    /**
     * Adds a metadata descriptor.
     *
     * @param toAdd the descriptor to add.
     * @throws IllegalArgumentException if descriptor does not meet container requirements, or
     *                                  already exist.
     */
    public final void addDescriptor(final MetadataDescriptor toAdd) throws IllegalArgumentException
    {
        // check with throwing exceptions
        this.containerType.assertConstraints(toAdd.getName(), toAdd.getRawData(), toAdd.getType(), toAdd.getStreamNumber(), toAdd.getLanguageIndex());
        // validate containers capabilities
        if (!isAddSupported(toAdd))
        {
            throw new IllegalArgumentException("Descriptor cannot be added, see isAddSupported(...)");
        }
        /*
         * Check for containers types capabilities.
         */
        // Search for descriptor list by name, language and stream.
        List<MetadataDescriptor> list;
        synchronized (this.perfPoint)
        {
            list = this.descriptors.get(this.perfPoint.setDescriptor(toAdd));
        }
        if (list == null)
        {
            list = new ArrayList<MetadataDescriptor>();
            this.descriptors.put(new DescriptorPointer(toAdd), list);
        }
        else
        {
            if (!list.isEmpty() && !this.containerType.isMultiValued())
            {
                throw new IllegalArgumentException("Container does not allow multiple values of descriptors with same name, language index and stream number");
            }
        }
        list.add(toAdd);
    }

    /**
     * This method asserts that this container has a descriptor with the
     * specified key, means returns an existing or creates a new descriptor.
     *
     * @param key the descriptor name to look up (or create)
     * @return the/a descriptor with the specified name (and initial type of
     * {@link MetadataDescriptor#TYPE_STRING}.
     */
    protected final MetadataDescriptor assertDescriptor(final String key)
    {
        return assertDescriptor(key, MetadataDescriptor.TYPE_STRING);
    }

    /**
     * This method asserts that this container has a descriptor with the
     * specified key, means returns an existing or creates a new descriptor.
     *
     * @param key  the descriptor name to look up (or create)
     * @param type if the descriptor is created, this data type is applied.
     * @return the/a descriptor with the specified name.
     */
    protected final MetadataDescriptor assertDescriptor(final String key, final int type)
    {
        MetadataDescriptor desc;
        final List<MetadataDescriptor> descriptorsByName = getDescriptorsByName(key);
        if (descriptorsByName == null || descriptorsByName.isEmpty())
        {
            desc = new MetadataDescriptor(getContainerType(), key, type);
            addDescriptor(desc);
        }
        else
        {
            desc = descriptorsByName.get(0);
        }
        return desc;
    }

    /**
     * Checks whether a descriptor already exists.<br>
     * Name, stream number and language index are compared. Data and data type
     * are ignored.
     *
     * @param lookup descriptor to look up.
     * @return <code>true</code> if such a descriptor already exists.
     */
    public final boolean containsDescriptor(final MetadataDescriptor lookup)
    {
        assert lookup != null;
        return this.descriptors.containsKey(this.perfPoint.setDescriptor(lookup));
    }

    /**
     * Returns the type of container this instance represents.<br>
     *
     * @return represented container type.
     */
    public final ContainerType getContainerType()
    {
        return this.containerType;
    }

    /**
     * {@inheritDoc}
     */
    public long getCurrentAsfChunkSize()
    {
        /*
         * 16 bytes GUID, 8 bytes chunk size, 2 bytes descriptor count
         */
        long result = 26;
        for (final MetadataDescriptor curr : getDescriptors())
        {
            result += curr.getCurrentAsfSize(this.containerType);
        }
        return result;
    }

    /**
     * Returns the number of contained descriptors.
     *
     * @return number of descriptors.
     */
    public final int getDescriptorCount()
    {
        return this.getDescriptors().size();
    }

    /**
     * Returns all stored descriptors.
     *
     * @return stored descriptors.
     */
    public final List<MetadataDescriptor> getDescriptors()
    {
        final List<MetadataDescriptor> result = new ArrayList<MetadataDescriptor>();
        for (final List<MetadataDescriptor> curr : this.descriptors.values())
        {
            result.addAll(curr);
        }
        return result;
    }

    /**
     * Returns a list of descriptors with the given
     * {@linkplain MetadataDescriptor#getName() name}.<br>
     *
     * @param name name of the descriptors to return
     * @return list of descriptors with given name.
     */
    public final List<MetadataDescriptor> getDescriptorsByName(final String name)
    {
        assert name != null;
        final List<MetadataDescriptor> result = new ArrayList<MetadataDescriptor>();
        final Collection<List<MetadataDescriptor>> values = this.descriptors.values();
        for (final List<MetadataDescriptor> currList : values)
        {
            if (!currList.isEmpty() && currList.get(0).getName().equals(name))
            {
                result.addAll(currList);
            }
        }
        return result;
    }

    /**
     * This method looks up a descriptor with given name and returns its value
     * as string.<br>
     *
     * @param name the name of the descriptor to look up.
     * @return the string representation of a found descriptors value. Even an
     * empty string if no descriptor has been found.
     */
    protected final String getValueFor(final String name)
    {
        String result = "";
        final List<MetadataDescriptor> descs = getDescriptorsByName(name);
        if (descs != null)
        {
            assert descs.size() <= 1;
            if (!descs.isEmpty())
            {
                result = descs.get(0).getString();
            }
        }
        return result;
    }

    /**
     * Determines if this container contains a descriptor with given
     * {@linkplain MetadataDescriptor#getName() name}.<br>
     *
     * @param name Name of the descriptor to look for.
     * @return <code>true</code> if descriptor has been found.
     */
    public final boolean hasDescriptor(final String name)
    {
        return !getDescriptorsByName(name).isEmpty();
    }

    /**
     * Determines/checks if the given descriptor may be added to the container.<br>
     * This implies a check for the capabilities of the container specified by
     * its {@linkplain #getContainerType() container type}.<br>
     *
     * @param descriptor the descriptor to test.
     * @return <code>true</code> if {@link #addDescriptor(MetadataDescriptor)}
     * can be called with given descriptor.
     */
    public boolean isAddSupported(final MetadataDescriptor descriptor)
    {
        boolean result = getContainerType().checkConstraints(descriptor.getName(), descriptor.getRawData(), descriptor.getType(), descriptor.getStreamNumber(), descriptor.getLanguageIndex()) == null;
        // Now check if there is already a value contained.
        if (result && !getContainerType().isMultiValued())
        {
            synchronized (this.perfPoint)
            {
                final List<MetadataDescriptor> list = this.descriptors.get(this.perfPoint.setDescriptor(descriptor));
                if (list != null)
                {
                    result = list.isEmpty();
                }
            }
        }
        return result;
    }

    /**
     * {@inheritDoc}
     */
    public final boolean isEmpty()
    {
        boolean result = true;
        if (getDescriptorCount() != 0)
        {
            final Iterator<MetadataDescriptor> iterator = getDescriptors().iterator();
            while (result && iterator.hasNext())
            {
                result &= iterator.next().isEmpty();
            }
        }
        return result;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        for (final MetadataDescriptor curr : getDescriptors())
        {
            result.append(prefix).append("  |-> ");
            result.append(curr);
            result.append(Utils.LINE_SEPARATOR);
        }
        return result.toString();
    }

    /**
     * Removes all stored descriptors with the given
     * {@linkplain MetadataDescriptor#getName() name}.<br>
     *
     * @param name the name to remove.
     */
    public final void removeDescriptorsByName(final String name)
    {
        assert name != null;
        final Iterator<List<MetadataDescriptor>> iterator = this.descriptors.values().iterator();
        while (iterator.hasNext())
        {
            final List<MetadataDescriptor> curr = iterator.next();
            if (!curr.isEmpty() && curr.get(0).getName().equals(name))
            {
                iterator.remove();
            }
        }
    }

    /**
     * {@linkplain #assertDescriptor(String) asserts} the existence of a
     * descriptor with given <code>name</code> and
     * {@linkplain MetadataDescriptor#setStringValue(String) assings} the string
     * value.
     *
     * @param name  the name of the descriptor to set the value for.
     * @param value the string value.
     */
    protected final void setStringValue(final String name, final String value)
    {
        assertDescriptor(name).setStringValue(value);
    }

    /**
     * {@inheritDoc}
     */
    public long writeInto(final OutputStream out) throws IOException
    {
        final long chunkSize = getCurrentAsfChunkSize();
        final List<MetadataDescriptor> descriptorList = getDescriptors();
        out.write(getGuid().getBytes());
        Utils.writeUINT64(chunkSize, out);
        Utils.writeUINT16(descriptorList.size(), out);
        for (final MetadataDescriptor curr : descriptorList)
        {
            curr.writeInto(out, this.containerType);
        }
        return chunkSize;
    }
}
