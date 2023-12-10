/**
 *  @author : Paul Taylor
 *
 *  Version @version:$Id$
 *
 *  MusicTag Copyright (C)2003,2004
 *
 *  This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 *  General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 *  or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 *  the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *  See the GNU Lesser General Public License for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 *  you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 *  Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 * Valid Text Encodings
 */
package org.jaudiotagger.tag.id3.valuepair;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.tag.datatype.AbstractIntStringValuePair;

import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;


/**
 * Text Encoding supported by ID3v24, the id is recognised by ID3
 * whereas the value maps to a java java.nio.charset.Charset, all the
 * charsets defined below are guaranteed on every Java platform.
 *
 * Note in ID3 UTF_16 can be implemented as either UTF16BE or UTF16LE with byte ordering
 * marks, in JAudioTagger we always implement it as UTF16LE because only this order
 * is understood in Windows, OSX seem to understand both.
 */
public class TextEncoding extends AbstractIntStringValuePair
{

    //Supported ID3 charset ids
    public static final byte ISO_8859_1 = 0;
    public static final byte UTF_16 = 1;               //We use UTF-16 with LE byte-ordering and byte order mark by default
                                                       //but can also use BOM with BE byte ordering
    public static final byte UTF_16BE = 2;
    public static final byte UTF_8 = 3;

    /** The number of bytes used to hold the text encoding field size. */
    public static final int TEXT_ENCODING_FIELD_SIZE = 1;

    private static TextEncoding textEncodings;

    private final Map<Integer, Charset> idToCharset = new HashMap<Integer, Charset>();

    /**
     * Get singleton for this class.
     *
     * @return singleton
     */
    public static synchronized TextEncoding getInstanceOf()
    {
        if (textEncodings == null)
        {
            textEncodings = new TextEncoding();
        }
        return textEncodings;
    }

    private TextEncoding()
    {
        idToCharset.put((int) ISO_8859_1, StandardCharsets.ISO_8859_1);
        idToCharset.put((int) UTF_16, StandardCharsets.UTF_16);
        idToCharset.put((int) UTF_16BE, StandardCharsets.UTF_16BE);
        idToCharset.put((int) UTF_8, StandardCharsets.UTF_8);

        for (final Map.Entry<Integer, Charset> e : idToCharset.entrySet()) {
            idToValue.put(e.getKey(), e.getValue().name());
        }

        createMaps();
    }

    /**
     * Allows to lookup id directly via the {@link Charset} instance.
     *
     * @param charset charset
     * @return id, e.g. {@link #ISO_8859_1}, or {@code null}, if not found
     */
    public Integer getIdForCharset(final Charset charset)
    {
        return valueToId.get(charset.name());
    }

    /**
     * Allows direct lookup of the {@link Charset} instance via an id.
     *
     * @param id id, e.g. {@link #ISO_8859_1}
     * @return charset or {@code null}, if not found
     */
    public Charset getCharsetForId(final int id)
    {
        return idToCharset.get(id);
    }
}
