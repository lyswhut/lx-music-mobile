package org.jaudiotagger.tag.id3;

import org.jaudiotagger.tag.id3.framebody.FrameBodyTDAT;

import java.util.Iterator;

/**
 * For use in ID3 for mapping YEAR field to TYER and TDAT Frames
 */
public class TyerTdatAggregatedFrame extends AggregatedFrame
{
    public TyerTdatAggregatedFrame()
    {

    }

    public static final String ID_TYER_TDAT = ID3v23Frames.FRAME_ID_V3_TYER+ID3v23Frames.FRAME_ID_V3_TDAT;
    public String getContent()
    {

        StringBuilder sb = new StringBuilder();
        Iterator<AbstractID3v2Frame> i = frames.iterator();
        AbstractID3v2Frame tyer = i.next();
        sb.append(tyer.getContent());
        AbstractID3v2Frame tdat = i.next();
        if(tdat.getContent().length()==FrameBodyTDAT.DATA_SIZE)
        {
            sb.append("-");
            sb.append(tdat.getContent().substring(FrameBodyTDAT.MONTH_START, FrameBodyTDAT.MONTH_END));

            if(!((FrameBodyTDAT)tdat.getBody()).isMonthOnly())
            {
                sb.append("-");
                sb.append(tdat.getContent().substring(FrameBodyTDAT.DAY_START, FrameBodyTDAT.DAY_END));
            }
        }
        return sb.toString();
    }

}
