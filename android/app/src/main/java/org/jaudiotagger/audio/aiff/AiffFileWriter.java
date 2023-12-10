/*
 * Entagged Audio Tag library
 * Copyright (c) 2003-2005 Raphaël Slinckx <raphael@slinckx.net>
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
package org.jaudiotagger.audio.aiff;

import org.jaudiotagger.audio.exceptions.CannotWriteException;
import org.jaudiotagger.audio.generic.AudioFileWriter2;
import org.jaudiotagger.tag.Tag;

import java.io.File;


/**
 * Write/delete tag info for Aiff file (Old Apple format)
 */
public class AiffFileWriter extends AudioFileWriter2
{

    private AiffTagWriter tw = new AiffTagWriter();

    @Override
    protected void writeTag(Tag tag, File file) throws CannotWriteException
    {
        tw.write(tag, file);
    }

    @Override
    protected void deleteTag(Tag tag, File file) throws CannotWriteException
    {
        tw.delete(tag, file);
    }


}

