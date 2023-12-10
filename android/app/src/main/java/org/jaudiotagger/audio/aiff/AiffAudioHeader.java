package org.jaudiotagger.audio.aiff;

import org.jaudiotagger.audio.generic.GenericAudioHeader;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Non-"tag" metadata from the AIFF file. In general, read-only.
 */
public class AiffAudioHeader extends GenericAudioHeader
{

    public enum Endian
    {
        BIG_ENDIAN,
        LITTLE_ENDIAN
    }

    private AiffType fileType;
    private Date timestamp;
    private Endian endian;
    private String audioEncoding;
    private String name;
    private String author;
    private String copyright;

    private List<String> applicationIdentifiers;
    private List<String> comments;
    private List<String> annotations;

    public AiffAudioHeader()
    {
        this.applicationIdentifiers = new ArrayList<String>();
        this.comments = new ArrayList<String>();
        this.annotations = new ArrayList<String>();
        this.endian = Endian.BIG_ENDIAN;
    }

    /**
     * Return the timestamp of the file.
     */
    public Date getTimestamp()
    {
        return timestamp;
    }

    /**
     * Set the timestamp.
     */
    public void setTimestamp(Date d)
    {
        timestamp = d;
    }

    /**
     * Return the file type (AIFF or AIFC)
     */
    public AiffType getFileType()
    {
        return fileType;
    }

    /**
     * Set the file type (AIFF or AIFC)
     */
    public void setFileType(AiffType typ)
    {
        fileType = typ;
    }

    /**
     * Return the author
     */
    public String getAuthor()
    {
        return author;
    }

    /**
     * Set the author
     */
    public void setAuthor(String a)
    {
        author = a;
    }

    /**
     * Return the name. May be null.
     */
    public String getName()
    {
        return name;
    }

    /**
     * Set the name
     */
    public void setName(String n)
    {
        name = n;
    }

    /**
     * Return the copyright. May be null.
     */
    public String getCopyright()
    {
        return copyright;
    }

    /**
     * Set the copyright
     */
    public void setCopyright(String c)
    {
        copyright = c;
    }


    /**
     * Return endian status (big or little)
     */
    public Endian getEndian()
    {
        return endian;
    }

    /**
     * Set endian status (big or little)
     */
    public void setEndian(Endian e)
    {
        endian = e;
    }

    /**
     * Return list of all application identifiers
     */
    public List<String> getApplicationIdentifiers()
    {
        return applicationIdentifiers;
    }

    /**
     * Add an application identifier. There can be any number of these.
     */
    public void addApplicationIdentifier(String id)
    {
        applicationIdentifiers.add(id);
    }

    /**
     * Return list of all annotations
     */
    public List<String> getAnnotations()
    {
        return annotations;
    }

    /**
     * Add an annotation. There can be any number of these.
     */
    public void addAnnotation(String a)
    {
        annotations.add(a);
    }

    /**
     * Return list of all comments
     */
    public List<String> getComments()
    {
        return comments;
    }

    /**
     * Add a comment. There can be any number of these.
     */
    public void addComment(String c)
    {
        comments.add(c);
    }

    public String toString()
    {
        StringBuilder sb = new StringBuilder("\n");

        if(name!=null && !name.isEmpty())
        {
            sb.append("\tName:"+name+"\n");
        }

        if(author!=null && !author.isEmpty())
        {
            sb.append("\tAuthor:"+author+"\n");
        }

        if(copyright!=null && !copyright.isEmpty())
        {
            sb.append("\tCopyright:"+copyright+"\n");
        }

        if(comments.size()>0)
        {
            sb.append("Comments:\n");
            for(String next:comments)
            {
                sb.append("\t"+next+"\n");
            }
        }

        if(applicationIdentifiers.size()>0)
        {
            sb.append("ApplicationIds:\n");
            for(String next:applicationIdentifiers)
            {
                sb.append("\t"+next+"\n");
            }
        }

        if(annotations.size()>0)
        {
            sb.append("Annotations:\n");
            for(String next:annotations)
            {
                sb.append("\t"+next+"\n");
            }
        }
        return super.toString() + sb.toString();
    }
}
