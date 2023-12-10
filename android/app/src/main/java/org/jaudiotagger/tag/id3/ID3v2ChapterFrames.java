/*
 * Horizon Wimba Copyright (C)2006
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 * or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with this library; if not,
 * you can getFields a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */
package org.jaudiotagger.tag.id3;

import java.util.TreeSet;

/**
 * Defines ID3 Chapter frames and collections that categorise frames.
 *
 * <p>For more details, please refer to the ID3 Chapter Frame specifications:
 * <ul>
 * <li><a href="http://www.id3.org/id3v2-chapters-1.0.txt">ID3 v2 Chapter Frame Spec</a>
 * </ul>
 *
 * @author Marc Gimpel, Horizon Wimba S.A.
 * @version $Id$
 */
public class ID3v2ChapterFrames extends ID3Frames
{
    public static final String FRAME_ID_CHAPTER = "CHAP";
    public static final String FRAME_ID_TABLE_OF_CONTENT = "CTOC";

    private static ID3v2ChapterFrames id3v2ChapterFrames;

    public static ID3v2ChapterFrames getInstanceOf()
    {
        if (id3v2ChapterFrames == null)
        {
            id3v2ChapterFrames = new ID3v2ChapterFrames();
        }
        return id3v2ChapterFrames;
    }

    private ID3v2ChapterFrames()
    {
        idToValue.put(FRAME_ID_CHAPTER, "Chapter");
        idToValue.put(FRAME_ID_TABLE_OF_CONTENT, "Table of content");
        createMaps();
        multipleFrames = new TreeSet<String>();
        discardIfFileAlteredFrames = new TreeSet<String>();
    }
}
