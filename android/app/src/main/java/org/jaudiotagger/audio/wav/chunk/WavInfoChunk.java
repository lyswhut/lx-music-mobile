package org.jaudiotagger.audio.wav.chunk;

import org.jaudiotagger.StandardCharsets;
import org.jaudiotagger.audio.generic.Utils;
import org.jaudiotagger.audio.iff.IffHeaderChunk;
import org.jaudiotagger.tag.FieldDataInvalidException;
import org.jaudiotagger.tag.wav.WavInfoTag;
import org.jaudiotagger.tag.wav.WavTag;

import java.nio.BufferUnderflowException;
import java.nio.ByteBuffer;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Stores basic only metadata but only exists as part of a LIST chunk, doesn't have its own size field
 * instead contains a number of name,size, value tuples. So for this reason we do not subclass the Chunk class
 */
public class WavInfoChunk {
    public static Logger logger = Logger.getLogger("org.jaudiotagger.audio.wav.WavInfoChunk");

    private WavInfoTag wavInfoTag;
    private String loggingName;

    public WavInfoChunk(WavTag tag, String loggingName) {
        this.loggingName = loggingName;
        wavInfoTag = new WavInfoTag();
        tag.setInfoTag(wavInfoTag);
    }

    /**
     * Read Info chunk
     *
     * @param chunkData
     */
    public boolean readChunks(ByteBuffer chunkData) {
        while (chunkData.remaining() >= IffHeaderChunk.TYPE_LENGTH) {
            String id = Utils.readFourBytesAsChars(chunkData);
            //Padding
            if (id.trim().isEmpty()) {
                return true;
            }
            int size = chunkData.getInt();

            if (
                    (!isAlphabetic(id.charAt(0))) ||
                            (!isAlphabetic(id.charAt(1))) ||
                            (!isAlphabetic(id.charAt(2))) ||
                            (!isAlphabetic(id.charAt(3)))
            ) {
                logger.severe(loggingName + "LISTINFO appears corrupt, ignoring:" + id + ":" + size);
                return false;
            }

            String value = null;
            try {
                value = Utils.getString(chunkData, 0, size, StandardCharsets.UTF_8);
            } catch (BufferUnderflowException bue) {
                logger.log(Level.SEVERE, loggingName + "LISTINFO appears corrupt, ignoring:" + bue.getMessage(), bue);
                return false;
            }

            logger.config(loggingName + "Result:" + id + ":" + size + ":" + value + ":");
            WavInfoIdentifier wii = WavInfoIdentifier.getByCode(id);
            if (wii != null && wii.getFieldKey() != null) {
                try {
                    wavInfoTag.setField(wii.getFieldKey(), value);
                } catch (FieldDataInvalidException fdie) {
                    logger.log(Level.SEVERE, loggingName + fdie.getMessage(), fdie);
                }
            }
            //Add unless just padding
            else if (id != null && !id.trim().isEmpty()) {
                wavInfoTag.addUnRecognizedField(id, value);
            }

            //Each tuple aligned on even byte boundary
            if (Utils.isOddLength(size) && chunkData.hasRemaining()) {
                chunkData.get();
            }
        }
        return true;
    }

    private static boolean isAlphabetic(int codePoint) {
        return (((((1 << Character.UPPERCASE_LETTER) |
                (1 << Character.LOWERCASE_LETTER) |
                (1 << Character.TITLECASE_LETTER) |
                (1 << Character.MODIFIER_LETTER) |
                (1 << Character.OTHER_LETTER) |
                (1 << Character.LETTER_NUMBER)) >> Character.getType(codePoint)) & 1) != 0);
    }
}
