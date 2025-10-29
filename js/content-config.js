// Google Drive content source configuration
// Fill in your API key and folder IDs. Keep this file client-side only with read-only access folders.
window.IUVENE_DRIVE_CONFIG = {
    enabled: false, // set to true to enable Drive as the primary data source
    apiKey: "", // e.g. AIza... (Browser API key)
    rootFolders: {
        // A folder that contains subfolders per collection. Each collection folder contains subfolders per product.
        // Example structure:
        // CollectionsRoot/
        //   Oceana/
        //     Fluid Ring/
        //       image1.jpg, image2.jpg
        //   Everyday/
        //     Ripple Ring/
        collections: "", // e.g. 1AbCDEFghIJKLmNOP

        // A folder that contains product folders that are not part of any collection.
        // NonCollectionsRoot/
        //   Waterway Studs/
        //     main.jpg, detail1.jpg
        nonCollections: "" // optional
    }
};


