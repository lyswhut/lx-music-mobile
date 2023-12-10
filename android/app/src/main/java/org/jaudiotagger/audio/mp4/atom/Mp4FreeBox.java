package org.jaudiotagger.audio.mp4.atom;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.mp4.Mp4AtomIdentifier;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;

/**
 * FreeBox ( padding)
 *
 * <p>There are usually two free boxes, one beneath the meta atom and one toplevel atom
 */
public class Mp4FreeBox extends AbstractMp4Box
{
    /**
     * Construct a new FreeBox containing datasize padding (i.e doesnt include header size)
     *
     * @param datasize padding size
     */
    public Mp4FreeBox(int datasize)
    {
        try
        {
            //Header
            header = new Mp4BoxHeader();
            ByteArrayOutputStream headerBaos = new ByteArrayOutputStream();
            headerBaos.write(Utils.getSizeBEInt32(Mp4BoxHeader.HEADER_LENGTH + datasize));
            headerBaos.write(Mp4AtomIdentifier.FREE.getFieldName().getBytes(StandardCharsets.ISO_8859_1));
            header.update(ByteBuffer.wrap(headerBaos.toByteArray()));

            //Body
            ByteArrayOutputStream freeBaos = new ByteArrayOutputStream();
            for (int i = 0; i < datasize; i++)
            {
                freeBaos.write(0x0);
            }
            dataBuffer = ByteBuffer.wrap(freeBaos.toByteArray());
        }
        catch (IOException ioe)
        {
            //This should never happen as were not actually writing to/from a file
            throw new RuntimeException(ioe);
        }
    }

}
