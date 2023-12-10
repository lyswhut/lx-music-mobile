package org.jaudiotagger.tag.reference;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Represents the ISO Script
 *
 * Contains an enum  of script, their four letter code and description
 * with additional method to allow an enum to be found by its four letter code or its description.
 */
public class ISOScript
{
    private static Map<String, Script> codeMap;
    private static Map<String, Script> descriptionMap;

    static
    {
        codeMap = new HashMap<String, Script>();
        for (Script script : Script.values())
        {
            codeMap.put(script.code, script);
        }

        descriptionMap = new HashMap<String, Script>();
        for (Script script : Script.values())
        {
            descriptionMap.put(script.description, script);
        }

    }

    /**
     * @param code
     * @return enum with this two letter code
     */
    public static Script getScriptByCode(String code)
    {
        return codeMap.get(code);
    }

    /**
     * @param description
     * @return enum with this description
     */
    public static Script getScriptByDescription(String description)
    {
        return descriptionMap.get(description);
    }

    /**
     * List of valid Iso Scripts, shows 4 letter abbreviation and script human readable name
     */
    public static enum Script
    {
        ARABIC("Arab", "Arabic"),
        IMPERIAL_ARAMAIC("Armi", "Imperial Aramaic"),
        ARMENIAN("Armn", "Armenian"),
        AVESTAN("Avst", "Avestan"),
        BALINESE("Bali", "Balinese"),
        BATAK("Batk", "Batak"),
        BENGALI("Beng", "Bengali"),
        BLISSYMBOLS("Blis", "Blissymbols"),
        BOPOMOFO("Bopo", "Bopomofo"),
        BRAHMI("Brah", "Brahmi"),
        BRAILLE("Brai", "Braille"),
        BUGINESE("Bugi", "Buginese"),
        BUHID("Buhd", "Buhid"),
        CHAKMA("Cakm", "Chakma"),
        CANADIAN_SYLLABICS("Cans", "Canadian Syllabics"),
        CARIAN("Cari", "Carian"),
        CHAM("Cham", "Cham"),
        CHEROKEE("Cher", "Cherokee"),
        CIRTH("Cirt", "Cirth"),
        COPTIC("Copt", "Coptic"),
        CYPRIOT("Cprt", "Cypriot"),
        CYRILLIC("Cyrl", "Cyrillic"),
        CYRILLIC_OLD_CHURCH_SLAVONIC_VARIANT("Cyrs", "Cyrillic (Old Church Slavonic variant)"),
        DEVANAGARI("Deva", "Devanagari"),
        DESERET("Dsrt", "Deseret"),
        EGYPTIAN_DEMOTIC("Egyd", "Egyptian demotic"),
        EGYPTIAN_HIERATIC("Egyh", "Egyptian hieratic"),
        EGYPTIAN_HIEROGLYPHS("Egyp", "Egyptian hieroglyphs"),
        ETHIOPIC("Ethi", "Ethiopic"),
        KHUTSURI("Geok", "Khutsuri"),
        GEORGIAN("Geor", "Georgian"),
        GLAGOLITIC("Glag", "Glagolitic"),
        GOTHIC("Goth", "Gothic"),
        GREEK("Grek", "Greek"),
        GUJARATI("Gujr", "Gujarati"),
        GURMUKHI("Guru", "Gurmukhi"),
        HANGUL("Hang", "Hangul"),
        HAN_HANJA("Hani", "Han (Hanzi, Kanji, Hanja)"),
        HANUNOO("Hano", "Hanunoo"),
        HAN_SIMPLIFIED("Hans", "Han (Simplified variant)"),
        HAN_TRADITIONAL("Hant", "Han (Traditional variant)"),
        HEBREW("Hebr", "Hebrew"),
        HIRAGANA("Hira", "Hiragana"),
        PAHAWH_HMONG("Hmng", "Pahawh Hmong"),
        HIRAGANA_KATAKANA("Hrkt", "Hiragana + Katakana"),
        OLD_HUNGARIAN("Hung", "Old Hungarian"),
        INDUS("Inds", "Indus"),
        OLD_ITALIC("Ital", "Old Italic"),
        JAVANESE("Java", "Javanese"),
        JAPANESE("Jpan", "Japanese"),
        KAYAH_LI("Kali", "Kayah Li"),
        KATAKANA("Kana", "Katakana"),
        KHAROSHTHI("Khar", "Kharoshthi"),
        KHMER("Khmr", "Khmer"),
        KANNADA("Knda", "Kannada"),
        KOREAN("Kore", "Korean"),
        KAITHI("Kthi", "Kaithi"),
        LANNA("Lana", "Lanna"),
        LAO("Laoo", "Lao"),
        LATIN_FRAKTUR_VARIANT("Latf", "Latin (Fraktur variant)"),
        LATIN_GAELIC_VARIANT("Latg", "Latin (Gaelic variant)"),
        LATIN("Latn", "Latin"),
        LEPCHA("Lepc", "Lepcha"),
        LIMBU("Limb", "Limbu"),
        LINEAR_A("Lina", "Linear A"),
        LINEAR_B("Linb", "Linear B"),
        LYCIAN("Lyci", "Lycian"),
        LYDIAN("Lydi", "Lydian"),
        MANDAEAN("Mand", "Mandaean"),
        MANICHAEAN("Mani", "Manichaean"),
        MAYAN_HIEROGLYPHS("Maya", "Mayan hieroglyphs"),
        MEROITIC("Mero", "Meroitic"),
        MALAYALAM("Mlym", "Malayalam"),
        MONGOLIAN("Mong", "Mongolian"),
        MOON("Moon", "Moon"),
        MEITEI_MAYEK("Mtei", "Meitei Mayek"),
        MYANMAR("Mymr", "Myanmar"),
        NKO("Nkoo", "N'ko"),
        OGHAM("Ogam", "Ogham"),
        OL_CHIKI("Olck", "Ol Chiki"),
        ORKHON("Orkh", "Orkhon"),
        ORIYA("Orya", "Oriya"),
        OSMANYA("Osma", "Osmanya"),
        OLD_PERMIC("Perm", "Old Permic"),
        PHAGS_PA("Phag", "Phags-pa"),
        INSCRIPTIONAL_PAHLAVI("Phli", "Inscriptional Pahlavi"),
        PSALTER_PAHLAVI("Phlp", "Psalter Pahlavi"),
        BOOK_PAHLAVI("Phlv", "Book Pahlavi"),
        PHOENICIAN("Phnx", "Phoenician"),
        POLLARD_PHONETIC("Plrd", "Pollard Phonetic"),
        INSCRIPTIONAL_PARTHIAN("Prti", "Inscriptional Parthian"),
        REJANG("Rjng", "Rejang"),
        RONGORONGO("Roro", "Rongorongo"),
        RUNIC("Runr", "Runic"),
        SAMARITAN("Samr", "Samaritan"),
        SARATI("Sara", "Sarati"),
        SAURASHTRA("Saur", "Saurashtra"),
        SIGNWRITING("Sgnw", "SignWriting"),
        SHAVIAN("Shaw", "Shavian"),
        SINHALA("Sinh", "Sinhala"),
        SUNDANESE("Sund", "Sundanese"),
        SYLOTI_NAGRI("Sylo", "Syloti Nagri"),
        SYRIAC("Syrc", "Syriac"),
        SYRIAC_ESTRANGELO_VARIANT("Syre", "Syriac (Estrangelo variant)"),
        SYRIAC_WESTERN_VARIANT("Syrj", "Syriac (Western variant)"),
        SYRIAC_EASTERN_VARIANT("Syrn", "Syriac (Eastern variant)"),
        TAGBANWA("Tagb", "Tagbanwa"),
        TAI_LE("Tale", "Tai Le"),
        TAI_LUE("Talu", "Tai Lue"),
        TAMIL("Taml", "Tamil"),
        TAI_VIET("Tavt", "Tai Viet"),
        TELUGU("Telu", "Telugu"),
        TENGWAR("Teng", "Tengwar"),
        TIFINAGH("Tfng", "Tifinagh"),
        TAGALOG("Tglg", "Tagalog"),
        THAANA("Thaa", "Thaana"),
        THAI("Thai", "Thai"),
        TIBETAN("Tibt", "Tibetan"),
        UGARITIC("Ugar", "Ugaritic"),
        VAI("Vaii", "Vai"),
        VISIBLE_SPEECH("Visp", "Visible Speech"),
        OLD_PERSIAN("Xpeo", "Old Persian"),
        CUNEIFORM_SUMERO_AKKADIAN("Xsux", "Cuneiform, Sumero-Akkadian"),
        YI("Yiii", "Yi"),
        MATHEMATICAL_NOTATION("Zmth", "Mathematical notation"),
        SYMBOLS("Zsym", "Symbols"),;

        private String code;
        private String description;

        Script(String code, String description)
        {
            this.code = code;
            this.description = description;
        }

        public String getCode()
        {
            return code;
        }

        public String getDescription()
        {
            return description;
        }

        public String toString()
        {
            return getDescription();
        }
    }
    
    public static String[] getDescriptionsAsArray()
    {
        List<String> descriptions = new ArrayList<String>();
        for(Script script:Script.values())
        {
            descriptions.add(script.description);
        }
        return descriptions.toArray(new String[0]);
    }
}