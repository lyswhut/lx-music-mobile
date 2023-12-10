package org.jaudiotagger.audio.mp4;

/**
 * This a list of mp4boxes identifiers that can bwe found in a mp4 container. This list is by no means
 * exhaustive.
 *
 * Only a limited number are of interest to Jaudiotagger
 */
public enum Mp4AtomIdentifier
{
    ALAC("alac", "Apple Lossless File"),
    ALBM("albm", "Album title and track number (user-data)"),
    AUTH("auth", "Media author name (user-data)"),
    BPCC("bpcc", "Bits per component"),
    BUFF("buff", "Buffering information"),
    BXML("bxml", "Binary XML container"),
    CCID("ccid", "OMA DRM Content ID"),
    CDEF("cdef", "Type and ordering of the components within the codestream"),
    CLSF("clsf", "Media classification (user-data)"),
    CMAP("cmap", "Mapping between a palette and codestream components"),
    CO64("co64", "64-bit chunk offset"),
    COLR("colr", "Specifies the colourspace of the image"),
    CPRT("cprt", "Copyright etc. (user-data)"),
    CRHD("crhd", "Reserved for ClockReferenceStream header"),
    CSLG("cslg", "Composition to decode timeline mapping"),
    CTTS("ctts", "(composition) time to sample"),
    CVRU("cvru", "OMA DRM Cover URI"),
    DCFD("dcfD", "Marlin DCF Duration, user-data atom type"),
    DINF("dinf", "Data information box, container"),
    DREF("dref", "Data reference box, declares source(s) of media data in track"),
    DRMS("drms", "DRM protected File"),
    DSCP("dscp", "Media description (user-data)"),
    DSGD("dsgd", "DVB Sample Group Description Box"),
    DSTG("dstg", "DVB Sample to Group Box"),
    EDTS("edts", "Edit list container"),
    ELST("elst", "An edit list"),
    ESDS("esds", "Track codec specific information"),
    FECI("feci", "FEC Informatiom"),
    FECR("fecr", "FEC Reservoir"),
    FIIN("fiin", "FD Item Information"),
    FIRE("fire", "File Reservoir"),
    FPAR("fpar", "File Partition"),
    FREE("free", "Padding"),
    FRMA("frma", "Original format box"),
    FTYP("ftyp", "File type Identification"),
    GITN("gitn", "Group ID to name"),
    GNRE("gnre", "Media genre (user-data)"),
    GRPI("grpi", "OMA DRM Group ID"),
    HDLR("hdlr", "Metadata Handler"),
    HMHD("hmhd", "Hint media header, overall information (hint track only)"),
    HNTI("hnti", "Hint tracks to aid a streaming server in remuxing the M4A file to an RTP stream."),
    ICNU("icnu", "OMA DRM Icon URI"),
    ID32("ID32", "ID3 version 2 container"),
    IDAT("idat", "Item data"),
    IHDR("ihdr", "Image Header"),
    IINF("iinf", "item information"),
    ILOC("iloc", "item location"),
    ILST("ilst", "MetaInformation Optional"),
    IMIF("imif", "IPMP Information box"),
    INFU("infu", "OMA DRM Info URL"),
    IODS("iods", "Object Descriptor container box"),
    IPHD("iphd", "reserved for IPMP Stream header"),
    IPMC("ipmc", "IPMP Control Box"),
    IPRO("ipro", "Item protection"),
    IREF("iref", "Item reference"),
    JP2C("jp2c", "JPEG 2000 contiguous codestream"),
    JP2H("jp2h", "Header"),
    JP2I("jp2i", "Intellectual property information"),
    KYWD("kywd", "Media keywords (user-data)"),
    LOCI("loci", "Media location information (user-data)"),
    LRCU("lrcu", "OMA DRM Lyrics URI"),
    M7HD("m7hd", "Reserved for MPEG7Stream header"),
    MDAT("mdat", "Audio Data"),
    MDHD("mdhd", "Media Header"),
    MDIA("mdia", "Container for the media information in a track"),
    MDRI("mdri", "Mutable DRM information"),
    MECO("meco", "Additional metadata container"),
    MEHD("mehd", "Movie extends header box"),
    MERE("mere", "Metabox relation"),
    META("meta", "MetaInformation"),
    MFHD("mfhd", "Movie fragment header"),
    MFRA("mfra", "Movie fragment random access "),
    MFRO("mfro", "Movie fragment random access offset"),
    MINF("minf", "Media information container"),
    MJHD("mjhd", "Reserved for MPEG-J Stream header"),
    MOOF("moof", "Movie fragment"),
    MOOV("moov", "Container for all the meta-data"),
    MP4A("mp4a", "AAC Audio"),
    MVCG("mvcg", "Multiview group"),
    MVCI("mvci", "Multiview Information"),
    MVEX("mvex", "Movie extends box"),
    MVHD("mvhd", "Movie Header"),
    MVRA("mvra", "Multiview Relation Attribute"),
    NMHD("nmhd", "Null media header, overall information (some tracks only)"),
    OCHD("ochd", "Reserved for ObjectContentInfoStream header"),
    ODAF("odaf", "OMA DRM Access Unit Format"),
    ODDA("odda", "OMA DRM Content Object"),
    ODHD("odhd", "Reserved for ObjectDescriptorStream header"),
    ODHE("odhe", "OMA DRM Discrete Media Headers"),
    ODRB("odrb", "OMA DRM Rights Object"),
    ODRM("odrm", "OMA DRM Container"),
    ODTT("odtt", "OMA DRM Transaction Tracking"),
    OHDR("ohdr", "OMA DRM Common headers"),
    PADB("padb", "Sample padding bits"),
    PAEN("paen", "Partition Entry"),
    PCLR("pclr", "palette which maps a single component in index space to a multiple- component image"),
    PDIN("pdin", "Progressive download information"),
    PERF("perf", "Media performer name (user-data)"),
    PITM("pitm", "Primary item reference"),
    RESC("resc", "Grid resolution at which the image was captured"),
    RESD("resd", "Default grid resolution at which the image should be displayed"),
    RTNG("rtng", "Media rating (user-data)"),
    SBGP("sbgp", "Sample to Group box"),
    SCHI("schi", "Scheme information box"),
    SCHM("schm", "Scheme type box"),
    SDEP("sdep", "Sample dependency"),
    SDHD("sdhd", "Reserved for SceneDescriptionStream header"),
    SDTP("sdtp", "Independent and Disposable Samples Box"),
    SDVP("sdvp", "SD Profile Box"),
    SEGR("segr", "File delivery session group"),
    SGPD("sgpd", "Sample group definition box"),
    SIDX("sidx", "Segment Index Box"),
    SINF("sinf", "Protection scheme information box"),
    SKIP("skip", "Free space"),
    SMHD("smhd", "Sound media header, overall information (sound track only)"),
    SRMB("srmb", "System Renewability Message"),
    SRMC("srmc", "System Renewability Message container"),
    SRPP("srpp", "STRP Process"),
    STBL("stbl", "Sample table box, container for the time/space map"),
    STCO("stco", "Offsets into Audio Data"),
    STDP("stdp", "Sample degradation priority"),
    STSC("stsc", "Sample-to-chunk, partial data-offset information"),
    STSD("stsd", "Sample descriptions (codec types, initialization etc.)"),
    STSH("stsh", "Shadow sync sample table"),
    STSS("stss", "Sync sample table (random access points)"),
    STSZ("stsz", "Sample sizes (framing)"),
    STTS("stts", "(decoding) time-to-sample"),
    STYP("styp", "Segment Type Box"),
    STZ2("stz2", "Compact sample sizes (framing)"),
    SUBS("subs", "Sub-sample information"),
    SWTC("swtc", "Multiview Group Relation"),
    TAGS("tags", "Nero Encoder Tags"),
    TFAD("tfad", "Track fragment adjustment box"),
    TFHD("tfhd", "Track fragment header"),
    TFMA("tfma", "Track fragment media adjustment box"),
    TFRA("tfra", "Track fragment radom access"),
    TIBR("tibr", "Tier Bit rate"),
    TIRI("tiri", "Tier Information"),
    TITL("titl", "Media title (user-data)"),
    TKHD("tkhd", "Track header, overall information about the track"),
    TRAF("traf", "Track fragment"),
    TRAK("trak", "Track"),
    TREF("tref", "Track reference container"),
    TREX("trex", "Track extends defaults"),
    TRGR("trgr", "Track grouping information"),
    TRUN("trun", "Track fragment run"),
    TSEL("tsel", "Track selection (user-data)"),
    UDTA("udta", "User Data"),
    UINF("uinf", "A tool by which a vendor may provide access to additional information associated with a UUID"),
    ULST("ulst", "A list of UUID’s"),
    URL$20("url$20", "a URL"),
    UUID("uuid", "User-extension box"),
    VMHD("vmhd", "video media header, overall information (video track only)"),
    VWDI("vwdi", "Multiview Scene Information"),
    XML$20("xml$20", "a tool by which vendors can add XML formatted information"),
    YRRC("yrrc", "Year when media was recorded (user-data)"),
    ;
    private String fieldName;
    private String description;

    Mp4AtomIdentifier(String fieldName, String description)
    {
        this.fieldName = fieldName;
        this.description = description;

    }

    /**
     * This is the value of the fieldname that is actually used to write mp4
     *
     * @return
     */
    public String getFieldName()
    {
        return fieldName;
    }

    /**
     * @return description, human redable description of the atom
     */
    public String getDescription()
    {
        return description;
    }
}
