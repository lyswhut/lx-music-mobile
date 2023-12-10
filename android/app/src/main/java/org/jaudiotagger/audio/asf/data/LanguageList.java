package org.jaudiotagger.audio.asf.data;

import org.jaudiotagger.audio.asf.util.Utils;
import org.jaudiotagger.logging.ErrorMessage;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

/**
 * This structure represents the data of the ASF language object.<br>
 * The language list is simply a listing of language codes which should comply
 * to RFC-1766.<br>
 * <b>Consider:</b> the index of a language is used by other entries in the ASF
 * metadata.
 *
 * @author Christian Laireiter
 */
public class LanguageList extends Chunk
{

    /**
     * List of language codes, complying RFC-1766
     */
    private final List<String> languages = new ArrayList<String>();

    /**
     * Creates a new instance.<br>
     */
    public LanguageList()
    {
        super(GUID.GUID_LANGUAGE_LIST, 0, BigInteger.ZERO);
    }

    /**
     * Creates an instance.
     *
     * @param pos  position within the ASF file.
     * @param size size of the chunk
     */
    public LanguageList(final long pos, final BigInteger size)
    {
        super(GUID.GUID_LANGUAGE_LIST, pos, size);
    }

    /**
     * This method adds a language.<br>
     *
     * @param language language code
     */
    public void addLanguage(final String language)
    {
        if (language.length() < MetadataDescriptor.MAX_LANG_INDEX)
        {
            if (!this.languages.contains(language))
            {
                this.languages.add(language);
            }
        }
        else
        {
            throw new IllegalArgumentException(ErrorMessage.WMA_LENGTH_OF_LANGUAGE_IS_TOO_LARGE.getMsg(language.length() * 2 + 2));
        }
    }

    /**
     * Returns the language code at the specified index.
     *
     * @param index the index of the language code to get.
     * @return the language code at given index.
     */
    public String getLanguage(final int index)
    {
        return this.languages.get(index);
    }

    /**
     * Returns the amount of stored language codes.
     *
     * @return number of stored language codes.
     */
    public int getLanguageCount()
    {
        return this.languages.size();
    }

    /**
     * Returns all language codes in list.
     *
     * @return list of language codes.
     */
    public List<String> getLanguages()
    {
        return new ArrayList<String>(this.languages);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String prettyPrint(final String prefix)
    {
        final StringBuilder result = new StringBuilder(super.prettyPrint(prefix));
        for (int i = 0; i < getLanguageCount(); i++)
        {
            result.append(prefix);
            result.append("  |-> ");
            result.append(i);
            result.append(" : ");
            result.append(getLanguage(i));
            result.append(Utils.LINE_SEPARATOR);
        }
        return result.toString();
    }

    /**
     * Removes the language entry at specified index.
     *
     * @param index index of language to remove.
     */
    public void removeLanguage(final int index)
    {
        this.languages.remove(index);
    }
}
