/**
 *  @author : Paul Taylor
 *  @author : Eric Farng
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
 * Base class for all ID3 tags
 *
 */
package org.jaudiotagger.tag.id3;

import java.util.logging.Logger;

/**
 * This is the abstract base class for all ID3 tags.
 *
 * @author : Eric Farng
 * @author : Paul Taylor
 */
public abstract class AbstractID3Tag extends AbstractTag
{
    //Logger
    public static Logger logger = Logger.getLogger("org.jaudiotagger.tag.id3");

    public AbstractID3Tag()
    {
    }

    protected static final String TAG_RELEASE = "ID3v";

    //The purpose of this is to provide the filename that should be used when writing debug messages
    //when problems occur reading or writing to file, otherwise it is difficult to track down the error
    //when processing many files
    private String loggingFilename = "";

    /**
     * Get full version
     */
    public String getIdentifier()
    {
        return TAG_RELEASE + getRelease() + "." + getMajorVersion() + "." + getRevision();
    }

    /**
     * Retrieve the Release
     *
     * @return
     */
    public abstract byte getRelease();


    /**
     * Retrieve the Major Version
     *
     * @return
     */
    public abstract byte getMajorVersion();

    /**
     * Retrieve the Revision
     *
     * @return
     */
    public abstract byte getRevision();


    public AbstractID3Tag(AbstractID3Tag copyObject)
    {
        super(copyObject);
    }



    /**
     * Retrieve the logging filename to be used in debugging
     *
     * @return logging filename to be used in debugging
     */
    protected String getLoggingFilename()
    {
        return loggingFilename;
    }

    /**
     * Set logging filename when construct tag for read from file
     *
     * @param loggingFilename
     */
    protected void setLoggingFilename(String loggingFilename)
    {
        this.loggingFilename = loggingFilename;
    }
}
