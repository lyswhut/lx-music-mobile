/**
 * @author : Paul Taylor
 *
 * Version @version:$Id$
 *
 * Jaudiotagger Copyright (C)2004,2005
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public  License as published by the Free Software Foundation; either version 2.1 of the License,
 * or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License ainteger with this library; if not,
 * you can get a copy from http://www.opensource.org/licenses/lgpl-license.php or write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 *
 * Description:
 */
package org.jaudiotagger.tag.reference;

import org.jaudiotagger.tag.datatype.AbstractIntStringValuePair;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Genre list
 *
 * <p>This is the IDv1 list with additional values as defined by Winamp, this list is also used in Mp4
 * files, note iTunes doesn't understand genres above MAX_STANDARD_GENRE_ID, Winamp does.
 */
public class GenreTypes extends AbstractIntStringValuePair
{
    private static final int MAX_STANDARD_GENRE_ID    = 125;
    private static final int MAX_GENRE_ID             = 191;

    /**
     * @return the maximum genreId that is part of the official Standard, genres above this were added by
     *         Winamp later.
     */
    public static int getMaxStandardGenreId()
    {
        return MAX_STANDARD_GENRE_ID;
    }

    public static int getMaxGenreId()
    {
        return MAX_GENRE_ID;
    }

    private static GenreTypes genreTypes;

    public static GenreTypes getInstanceOf()
    {
        if (genreTypes == null)
        {
            genreTypes = new GenreTypes();
        }
        return genreTypes;
    }

    //This maps the lowercase version to the id, so applications can map from the lowercase value to the id
    private Map<String, Integer> nameToIdMap;


    private GenreTypes()
    {
        idToValue.put(0, "Blues");
        idToValue.put(1, "Classic Rock");
        idToValue.put(2, "Country");
        idToValue.put(3, "Dance");
        idToValue.put(4, "Disco");
        idToValue.put(5, "Funk");
        idToValue.put(6, "Grunge");
        idToValue.put(7, "Hip-Hop");
        idToValue.put(8, "Jazz");
        idToValue.put(9, "Metal");
        idToValue.put(10, "New Age");
        idToValue.put(11, "Oldies");
        idToValue.put(12, "Other");
        idToValue.put(13, "Pop");
        idToValue.put(14, "R&B");
        idToValue.put(15, "Rap");
        idToValue.put(16, "Reggae");
        idToValue.put(17, "Rock");
        idToValue.put(18, "Techno");
        idToValue.put(19, "Industrial");
        idToValue.put(20, "Alternative");
        idToValue.put(21, "Ska");
        idToValue.put(22, "Death Metal");
        idToValue.put(23, "Pranks");
        idToValue.put(24, "Soundtrack");
        idToValue.put(25, "Euro-Techno");
        idToValue.put(26, "Ambient");
        idToValue.put(27, "Trip-Hop");
        idToValue.put(28, "Vocal");
        idToValue.put(29, "Jazz+Funk");
        idToValue.put(30, "Fusion");
        idToValue.put(31, "Trance");
        idToValue.put(32, "Classical");
        idToValue.put(33, "Instrumental");
        idToValue.put(34, "Acid");
        idToValue.put(35, "House");
        idToValue.put(36, "Game");
        idToValue.put(37, "Sound Clip");
        idToValue.put(38, "Gospel");
        idToValue.put(39, "Noise");
        idToValue.put(40, "AlternRock");
        idToValue.put(41, "Bass");
        idToValue.put(42, "Soul");
        idToValue.put(43, "Punk");
        idToValue.put(44, "Space");
        idToValue.put(45, "Meditative");
        idToValue.put(46, "Instrumental Pop");
        idToValue.put(47, "Instrumental Rock");
        idToValue.put(48, "Ethnic");
        idToValue.put(49, "Gothic");
        idToValue.put(50, "Darkwave");
        idToValue.put(51, "Techno-Industrial");
        idToValue.put(52, "Electronic");
        idToValue.put(53, "Pop-Folk");
        idToValue.put(54, "Eurodance");
        idToValue.put(55, "Dream");
        idToValue.put(56, "Southern Rock");
        idToValue.put(57, "Comedy");
        idToValue.put(58, "Cult");
        idToValue.put(59, "Gangsta");
        idToValue.put(60, "Top 40");
        idToValue.put(61, "Christian Rap");
        idToValue.put(62, "Pop/Funk");
        idToValue.put(63, "Jungle");
        idToValue.put(64, "Native American");
        idToValue.put(65, "Cabaret");
        idToValue.put(66, "New Wave");
        idToValue.put(67, "Psychadelic");
        idToValue.put(68, "Rave");
        idToValue.put(69, "Showtunes");
        idToValue.put(70, "Trailer");
        idToValue.put(71, "Lo-Fi");
        idToValue.put(72, "Tribal");
        idToValue.put(73, "Acid Punk");
        idToValue.put(74, "Acid Jazz");
        idToValue.put(75, "Polka");
        idToValue.put(76, "Retro");
        idToValue.put(77, "Musical");
        idToValue.put(78, "Rock & Roll");
        idToValue.put(79, "Hard Rock");
        idToValue.put(80, "Folk");
        idToValue.put(81, "Folk-Rock");
        idToValue.put(82, "National Folk");
        idToValue.put(83, "Swing");
        idToValue.put(84, "Fast Fusion");
        idToValue.put(85, "Bebob");
        idToValue.put(86, "Latin");
        idToValue.put(87, "Revival");
        idToValue.put(88, "Celtic");
        idToValue.put(89, "Bluegrass");
        idToValue.put(90, "Avantgarde");
        idToValue.put(91, "Gothic Rock");
        idToValue.put(92, "Progressive Rock");
        idToValue.put(93, "Psychedelic Rock");
        idToValue.put(94, "Symphonic Rock");
        idToValue.put(95, "Slow Rock");
        idToValue.put(96, "Big Band");
        idToValue.put(97, "Chorus");
        idToValue.put(98, "Easy Listening");
        idToValue.put(99, "Acoustic");
        idToValue.put(100, "Humour");
        idToValue.put(101, "Speech");
        idToValue.put(102, "Chanson");
        idToValue.put(103, "Opera");
        idToValue.put(104, "Chamber Music");
        idToValue.put(105, "Sonata");
        idToValue.put(106, "Symphony");
        idToValue.put(107, "Booty Bass");
        idToValue.put(108, "Primus");
        idToValue.put(109, "Porn Groove");
        idToValue.put(110, "Satire");
        idToValue.put(111, "Slow Jam");
        idToValue.put(112, "Club");
        idToValue.put(113, "Tango");
        idToValue.put(114, "Samba");
        idToValue.put(115, "Folklore");
        idToValue.put(116, "Ballad");
        idToValue.put(117, "Power Ballad");
        idToValue.put(118, "Rhythmic Soul");
        idToValue.put(119, "Freestyle");
        idToValue.put(120, "Duet");
        idToValue.put(121, "Punk Rock");
        idToValue.put(122, "Drum Solo");
        idToValue.put(123, "Acapella");
        idToValue.put(124, "Euro-House");
        idToValue.put(125, "Dance Hall");
        idToValue.put(126, "Goa");
        idToValue.put(127, "Drum & Bass");
        idToValue.put(128, "Club-House");
        idToValue.put(129, "Hardcore");
        idToValue.put(130, "Terror");
        idToValue.put(131, "Indie");
        idToValue.put(132, "BritPop");
        idToValue.put(133, "Negerpunk"); // to say the least - this name is problematic
        idToValue.put(134, "Polsk Punk");
        idToValue.put(135, "Beat");
        idToValue.put(136, "Christian Gangsta Rap");
        idToValue.put(137, "Heavy Metal");
        idToValue.put(138, "Black Metal");
        idToValue.put(139, "Crossover");
        idToValue.put(140, "Contemporary Christian");
        idToValue.put(141, "Christian Rock");
        idToValue.put(142, "Merengue");
        idToValue.put(143, "Salsa");
        idToValue.put(144, "Thrash Metal");
        idToValue.put(145, "Anime");
        idToValue.put(146, "JPop");
        idToValue.put(147, "SynthPop");

        // additional Winamp 5.6 values taken from http://en.wikipedia.org/wiki/ID3#Winamp_Extensions
        idToValue.put(148, "Abstract");
        idToValue.put(149, "Art Rock");
        idToValue.put(150, "Baroque");
        idToValue.put(151, "Bhangra");
        idToValue.put(152, "Big Beat");
        idToValue.put(153, "Breakbeat");
        idToValue.put(154, "Chillout");
        idToValue.put(155, "Downtempo");
        idToValue.put(156, "Dub");
        idToValue.put(157, "EBM");
        idToValue.put(158, "Eclectic");
        idToValue.put(159, "Electro");
        idToValue.put(160, "Electroclash");
        idToValue.put(161, "Emo");
        idToValue.put(162, "Experimental");
        idToValue.put(163, "Garage");
        idToValue.put(164, "Global");
        idToValue.put(165, "IDM");
        idToValue.put(166, "Illbient");
        idToValue.put(167, "Industro-Goth");
        idToValue.put(168, "Jam Band");
        idToValue.put(169, "Krautrock");
        idToValue.put(170, "Leftfield");
        idToValue.put(171, "Lounge");
        idToValue.put(172, "Math Rock");
        idToValue.put(173, "New Romantic");
        idToValue.put(174, "Nu-Breakz");
        idToValue.put(175, "Post-Punk");
        idToValue.put(176, "Post-Rock");
        idToValue.put(177, "Psytrance");
        idToValue.put(178, "Shoegaze");
        idToValue.put(179, "Space Rock");
        idToValue.put(180, "Trop Rock");
        idToValue.put(181, "World Music");
        idToValue.put(182, "Neoclassical");
        idToValue.put(183, "Audiobook");
        idToValue.put(184, "Audio Theatre");
        idToValue.put(185, "Neue Deutsche Welle");
        idToValue.put(186, "Podcast");
        idToValue.put(187, "Indie Rock");
        idToValue.put(188, "G-Funk");
        idToValue.put(189, "Dubstep");
        idToValue.put(190, "Garage Rock");
        idToValue.put(191, "Psybient");

        createMaps();

        //We now need to map from lowercase version to Id
        nameToIdMap = new LinkedHashMap<String, Integer>(idToValue.size());
        for (Map.Entry<Integer, String> entry : idToValue.entrySet())
        {
            nameToIdMap.put(entry.getValue().toLowerCase(), entry.getKey());
        }
    }

    /**
     * Get Id for name, match is not case sensitive
     *
     * @param name genre name
     * @return id or {@code null}, if not found
     */
    public Integer getIdForName(String name)
    {
        return nameToIdMap.get(name.toLowerCase());
    }


}
