package org.jaudiotagger.tag.images;

import org.jaudiotagger.audio.flac.metadatablock.MetadataBlockDataPicture;

import java.io.File;
import java.io.IOException;

/**
 * Get appropriate Artwork class
 */
public class ArtworkFactory {


    public static Artwork getNew() {
        return new AndroidArtwork();
    }

    /**
     * Create Artwork instance from A Flac Metadata Block
     *
     * @param coverArt
     * @return
     */
    public static Artwork createArtworkFromMetadataBlockDataPicture(MetadataBlockDataPicture coverArt) {
        return AndroidArtwork.createArtworkFromMetadataBlockDataPicture(coverArt);
    }

    /**
     * Create Artwork instance from an image file
     *
     * @param file
     * @return
     * @throws IOException
     */
    public static Artwork createArtworkFromFile(File file) throws IOException {
        return AndroidArtwork.createArtworkFromFile(file);
    }

    /**
     * Create Artwork instance from an image file
     *
     * @param link
     * @return
     * @throws IOException
     */
    public static Artwork createLinkedArtworkFromURL(String link) throws IOException {
        return AndroidArtwork.createLinkedArtworkFromURL(link);
    }
}
