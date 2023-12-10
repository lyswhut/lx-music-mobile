package org.jaudiotagger.tag.reference;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


/**
 * Represents the ISO 3166-1 Country List with ISO 3166-1-alpha-2 code
 *
 * Contains an enum  of countries, their two letter code and description
 * with additional method to allow an enum to be found by its two letter code or its description.
 * More details at http://www.iso.org/iso/country_codes/iso_3166_code_lists/english_country_names_and_code_elements.htm#c
 */
public class ISOCountry
{
    private static Map<String, Country> codeMap;
    private static Map<String, Country> descriptionMap;

    static
    {
        codeMap = new HashMap<String, Country>();
        for (Country country : Country.values())
        {
            codeMap.put(country.code, country);
        }

        descriptionMap = new HashMap<String, Country>();
        for (Country country : Country.values())
        {
            descriptionMap.put(country.description, country);
        }

    }

    /**
     * @param code
     * @return enum with this two letter code
     */
    public static Country getCountryByCode(String code)
    {
        return codeMap.get(code);
    }

    /**
     * @param description
     * @return enum with this description
     */
    public static Country getCountryByDescription(String description)
    {
        return descriptionMap.get(description);
    }

    /**
     * List of valid Iso Country, shows 2 letter abbreviation and country human readable name
     */
    public static enum Country
    {
        AFGHANISTAN(" AF", "Afghanistan"),
        ALAND_ISLANDS("AX", "Åland Islands"),
        ALBANIA("AL", "Albania"),
        ALGERIA("DZ", "Algeria"),
        AMERICAN_SAMOA("AS", "American Samoa"),
        ANDORRA("AD", "Andorra"),
        ANGOLA("AO", "Angola"),
        ANGUILLA("AI", "Anguilla"),
        ANTARCTICA("AQ", "Antarctica"),
        ANTIGUA_AND_BARBUDA("AG", "Antigua and Barbuda"),
        ARGENTINA("AR", "Argentina"),
        ARMENIA("AM", "Armenia"),
        ARUBA("AW", "Aruba"),
        AUSTRALIA("AU", "Australia"),
        AUSTRIA("AT", "Austria"),
        AZERBAIJAN("AZ", "Azerbaijan"),
        BAHAMAS("BS", "Bahamas"),
        BAHRAIN("BH", "Bahrain"),
        BANGLADESH("BD", "Bangladesh"),
        BARBADOS("BB", "Barbados"),
        BELARUS("BY", "Belarus"),
        BELGIUM("BE", "Belgium"),
        BELIZE("BZ", "Belize"),
        BENIN("BJ", "Benin"),
        BERMUDA("BM", "Bermuda"),
        BHUTAN("BT", "Bhutan"),
        BOLIVIA("BO", "Bolivia"),
        BOSNIA_AND_HERZEGOVINA("BA", "Bosnia and herzegovina"),
        BOTSWANA("BW", "Botswana"),
        BOUVET_ISLAND("BV", "Bouvet_Island"),
        BRAZIL("BR", "Brazil"),
        BRITISH_INDIAN_OCEAN_TERRITORY("IO", "British Indian Ocean Territory"),
        BRUNEI_DARUSSALAM("BN", "Brunei Darussalam"),
        BULGARIA("BG", "Bulgaria"),
        BURKINA_FASO("BF", "Burkina Faso"),
        BURUNDI("BI", "Burundi"),
        CAMBODIA("KH", "Cambodia"),
        CAMEROON("CM", "Cameroon"),
        CANADA("CA", "Canada"),
        CAPE_VERDE("CV", "Cape Verde"),
        CAYMAN_ISLANDS("KY", "Cayman Islands"),
        CENTRAL_AFRICAN_REPUBLIC("CF", "Central African Republic"),
        CHAD("TD", "Chad"),
        CHILE("CL", "Chile"),
        CHINA("CN", "China"),
        CHRISTMAS_ISLAND("CX", "Christmas Island"),
        COCOS_KEELING_ISLANDS("CC", "Cocos Keeling Islands"),
        COLOMBIA("CO", "Colombia"),
        COMOROS("KM", "Comoros"),
        CONGO("CG", "Congo"),
        THE_DEMOCRATIC_REPUBLIC_OF_CONGO("CD", "The Democratic Republic Of Congo"),
        COOK_ISLANDS("CK", "Cook Islands"),
        COSTA_RICA("CR", "Costa Rica"),
        COTE_D_IVOIRE("CI", "Ivory Coast"),
        CROATIA("HR", "Croatia"),
        CUBA("CU", "Cuba"),
        CYPRUS("CY", "Cyprus"),
        CZECH_REPUBLIC("CZ", "Czech Republic"),
        DENMARK("DK", "Denmark"),
        DJIBOUTI("DJ", "Djibouti"),
        DOMINICA("DM", "Dominica"),
        DOMINICAN_REPUBLIC("DO", "Dominican Republic"),
        ECUADOR("EC", "Ecuador"),
        EGYPT("EG", "Egypt"),
        EL_SALVADOR("SV", "El Salvador"),
        EQUATORIAL_GUINEA("GQ", "Equatorial Guinea"),
        ERITREA("ER", "Eritrea"),
        ESTONIA("EE", "Estonia"),
        ETHIOPIA("ET", "Ethiopia"),
        FALKLAND_ISLANDS("FK", "Falkland Islands"),
        FAROE_ISLANDS("FO", "Faroe Islands"),
        FIJI("FJ", "Fiji"),
        FINLAND("FI", "Finland"),
        FRANCE("FR", "France"),
        FRENCH_GUIANA("GF", "French Guiana"),
        FRENCH_POLYNESIA("PF", "French Polynesia"),
        FRENCH_SOUTHERN_TERRITORIES("TF", "French Southern Territories"),
        GABON("GA", "Gabon"),
        GAMBIA("GM", "Gambia"),
        GEORGIA("GE", "Georgia"),
        GERMANY("DE", "Germany"),
        GHANA("GH", "Ghana"),
        GIBRALTAR("GI", "Gibraltar"),
        GREECE("GR", "Greece"),
        GREENLAND("GL", "Greenland"),
        GRENADA("GD", "Grenada"),
        GUADELOUPE("GP", "Guadeloupe"),
        GUAM("GU", "Guam"),
        GUATEMALA("GT", "Guatemala"),
        GUERNSEY("GG", "Guernsey"),
        GUINEA("GN", "Guinea"),
        GUINEA_BISSAU("GW", "Guinea_Bissau"),
        GUYANA("GY", "Guyana"),
        HAITI("HT", "Haiti"),
        HEARD_ISLAND_AND_MCDONALD_ISLANDS("HM", "Heard Island and Mcdonald Islands"),
        HONDURAS("HN", "Honduras"),
        HONG_KONG("HK", "Hong Kong"),
        HUNGARY("HU", "Hungary"),
        ICELAND("IS", "Iceland"),
        INDIA("IN", "India"),
        INDONESIA("ID", "Indonesia"),
        IRAN("IR", "Iran"),
        IRAQ("IQ", "Iraq"),
        IRELAND("IE", "Ireland"),
        ISLE_OF_MAN("IM", "Isle Of Man"),
        ISRAEL("IL", "Israel"),
        ITALY("IT", "Italy"),
        JAMAICA("JM", "Jamaica"),
        JAPAN("JP", "Japan"),
        JERSEY("JE", "Jersey"),
        JORDAN("JO", "Jordan"),
        KAZAKHSTAN("KZ", "Kazakhstan"),
        KENYA("KE", "Kenya"),
        KIRIBATI("KI", "Kiribati"),
        KOREA_NORTH("KP", "North Korea"),
        KOREA_SOUTH("KR", "South Korea"),
        KUWAIT("KW", "Kuwait"),
        KYRGYZSTAN("KG", "Kyrgyzstan"),
        LAO_PEOPLES_DEMOCRATIC_REPUBLIC("LA", "Lao"),
        LATVIA("LV", "Latvia"),
        LEBANON("LB", "Lebanon"),
        LESOTHO("LS", "Lesotho"),
        LIBERIA("LR", "Liberia"),
        LIBYAN_ARAB_JAMAHIRIYA("LY", "Libyan Arab Jamahiriya"),
        LIECHTENSTEIN("LI", "Liechtenstein"),
        LITHUANIA("LT", "Lithuania"),
        LUXEMBOURG("LU", "Luxembourg"),
        MACAO("MO", "Macao"),
        MACEDONIA("MK", "Macedonia"),
        MADAGASCAR("MG", "Madagascar"),
        MALAWI("MW", "Malawi"),
        MALAYSIA("MY", "Malaysia"),
        MALDIVES("MV", "Maldives"),
        MALI("ML", "Mali"),
        MALTA("MT", "Malta"),
        MARSHALL_ISLANDS("MH", "Marshall Islands"),
        MARTINIQUE("MQ", "Martinique"),
        MAURITANIA("MR", "Mauritania"),
        MAURITIUS("MU", "Mauritius"),
        MAYOTTE("YT", "Mayotte"),
        MEXICO("MX", "Mexico"),
        MICRONESIA("FM", "Micronesia"),
        MOLDOVA("MD", "Moldova"),
        MONACO("MC", "Monaco"),
        MONGOLIA("MN", "Mongolia"),
        MONTENEGRO("ME", "Montenegro"),
        MONTSERRAT("MS", "Montserrat"),
        MOROCCO("MA", "Morocco"),
        MOZAMBIQUE("MZ", "Mozambique"),
        MYANMAR("MM", "Myanmar"),
        NAMIBIA("NA", "Namibia"),
        NAURU("NR", "Nauru"),
        NEPAL("NP", "Nepal"),
        NETHERLANDS("NL", "Netherlands"),
        NETHERLANDS_ANTILLES("AN", "Netherlands Antilles"),
        NEW_CALEDONIA("NC", "New Caledonia"),
        NEW_ZEALAND("NZ", "New Zealand"),
        NICARAGUA("NI", "Nicaragua"),
        NIGER("NE", "Niger"),
        NIGERIA("NG", "Nigeria"),
        NIUE("NU", "Niue"),
        NORFOLK_ISLAND("NF", "Norfolk Island"),
        NORTHERN_MARIANA_ISLANDS("MP", "Northern Mariana Islands"),
        NORWAY("NO", "Norway"),
        OMAN("OM", "Oman"),
        PAKISTAN("PK", "Pakistan"),
        PALAU("PW", "Palau"),
        PALESTINIAN_TERRITORY_OCCUPIED("PS", "Palestinian Territory Occupied"),
        PANAMA("PA", "Panama"),
        PAPUA_NEW_GUINEA("PG", "Papua New Guinea"),
        PARAGUAY("PY", "Paraguay"),
        PERU("PE", "Peru"),
        PHILIPPINES("PH", "Philippines"),
        PITCAIRN("PN", "Pitcairn"),
        POLAND("PL", "Poland"),
        PORTUGAL("PT", "Portugal"),
        PUERTO_RICO("PR", "Puerto Rico"),
        QATAR("QA", "Qatar"),
        REUNION("RE", "Union"),
        ROMANIA("RO", "Romania"),
        RUSSIAN_FEDERATION("RU", "Russia"),
        RWANDA("RW", "Rwanda"),
        SAINT_BARTHOLEMY("BL", "Lemy"),
        SAINT_HELENA("SH", "St Helena"),
        SAINT_KITTS_AND_NEVIS("KN", "St Kitts and Nevis"),
        SAINT_LUCIA("LC", "St Lucia"),
        SAINT_MARTIN("MF", "St Martin"),
        SAINT_PIERRE_AND_MIQUELON("PM", "St Pierre and Miquelon"),
        SAINT_VINCENT_AND_THE_GRENADINES("VC", "St Vincent and the Grenadines"),
        SAMOA("WS", "Samoa"),
        SAN_MARINO("SM", "San_Marino"),
        SAO_TOME_AND_PRINCIPE("ST", "Sao Tome and Principe"),
        SAUDI_ARABIA("SA", "Saudi Arabia"),
        SENEGAL("SN", "Senegal"),
        SERBIA("RS", "Serbia"),
        SEYCHELLES("SC", "Seychelles"),
        SIERRA_LEONE("SL", "Sierra Leone"),
        SINGAPORE("SG", "Singapore"),
        SLOVAKIA("SK", "Slovakia"),
        SLOVENIA("SI", "Slovenia"),
        SOLOMON_ISLANDS("SB", "Solomon Islands"),
        SOMALIA("SO", "Somalia"),
        SOUTH_AFRICA("ZA", "South Africa"),
        SOUTH_GEORGIA_AND_THE_SOUTH_SANDWICH_Islands("GS", "South Georgia and the South Sandwich Islands"),
        SPAIN("ES", "Spain"),
        SRI_LANKA("LK", "Sri Lanka"),
        SUDAN("SD", "Sudan"),
        SURINAME("SR", "Suriname"),
        SVALBARD_AND_JAN_MAYEN("SJ", "Svalbard and Jan Mayen"),
        SWAZILAND("SZ", "Swaziland"),
        SWEDEN("SE", "Sweden"),
        SWITZERLAND("CH", "Switzerland"),
        SYRIA("SY", "Syria"),
        TAIWAN("TW", "Taiwan"),
        TAJIKISTAN("TJ", "Tajikistan"),
        TANZANIA("TZ", "Tanzania"),
        THAILAND("TH", "Thailand"),
        TIMOR_LESTE("TL", "Timor Leste"),
        TOGO("TG", "Togo"),
        TOKELAU("TK", "Tokelau"),
        TONGA("TO", "Tonga"),
        TRINIDAD_AND_TOBAGO("TT", "Trinidad and Tobago"),
        TUNISIA("TN", "Tunisia"),
        TURKEY("TR", "Turkey"),
        TURKMENISTAN("TM", "Turkmenistan"),
        TURKS_AND_CAICOS_ISLANDS("TC", "Turks and Caicos Islands"),
        TUVALU("TV", "Tuvalu"),
        UGANDA("UG", "Uganda"),
        UKRAINE("UA", "Ukraine"),
        UNITED_ARAB_EMIRATES("AE", "United Arab Emirates"),
        UNITED_KINGDOM("GB", "United Kingdom"),
        UNITED_STATES("US", "United States"),
        UNITED_STATES_MINOR_OUTLYING_ISLANDS("UM", "United States Minor Outlying Islands"),
        URUGUAY("UY", "Uruguay"),
        UZBEKISTAN("UZ", "Uzbekistan"),
        VANUATU("VU", "Vanuatu"),
        VATICAN_CITY("VA", "Vatican City"),
        VENEZUELA("VE", "Venezuela"),
        VIETNAM("VN", "Vietnam"),
        VIRGIN_ISLANDS_BRITISH("VG", "British Virgin Islands"),
        VIRGIN_ISLANDS_US("VI", "US Virgin Islands"),
        WALLIS_AND_FUTUNA("WF", "Wallis and Futuna"),
        WESTERN_SAHARA("EH", "Western Sahara"),
        YEMEN("YE", "Yemen"),
        ZAMBIA("ZM", "Zambia"),
        ZIMBABWE("ZW", "Zimbabwe");


        private String code;
        private String description;

        Country(String code, String description)
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
        for (Country country : Country.values())
        {
            descriptions.add(country.description);
        }
        return descriptions.toArray(new String[0]);
    }
}