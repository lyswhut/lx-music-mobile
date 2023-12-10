/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Rapha�l Slinckx <raphael@slinckx.net>
 * 
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *  
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package org.jaudiotagger.audio.wav;

import org.jaudiotagger.audio.exceptions.CannotReadException;
import org.jaudiotagger.audio.generic.Utils;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;

import static org.jaudiotagger.audio.iff.IffHeaderChunk.HEADER_LENGTH;

/**
 * Processes the Wav Header
 *
 * This is simply the first 12 bytes of the file http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
 */
public class WavRIFFHeader
{
    public static final String RIFF_SIGNATURE = "RIFF";
    public static final String WAVE_SIGNATURE = "WAVE";

    public static boolean isValidHeader(FileChannel fc) throws IOException, CannotReadException
    {
        if (fc.size() - fc.position() < HEADER_LENGTH)
        {
            throw new CannotReadException("This is not a WAV File (<12 bytes)");
        }
        ByteBuffer headerBuffer = Utils.readFileDataIntoBufferLE(fc, HEADER_LENGTH);
        if(Utils.readFourBytesAsChars(headerBuffer).equals(RIFF_SIGNATURE))
        {
            headerBuffer.getInt(); //Size
            if(Utils.readFourBytesAsChars(headerBuffer).equals(WAVE_SIGNATURE))
            {
                return true;
            }
        }
        return false;
    }

}