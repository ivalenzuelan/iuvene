// Lightweight Google Drive helper to build products/collections from folder structure
(function () {
    const DRIVE_FIELDS = 'files(id,name,mimeType,parents,thumbnailLink,webViewLink)';
    const IMAGE_MIME_PREFIX = 'image/';

    function getConfig() {
        return window.IUVENE_DRIVE_CONFIG || { enabled: false };
    }

    async function driveListFolder(folderId) {
        const cfg = getConfig();
        if (!cfg.apiKey) throw new Error('Drive API key missing');
        const params = new URLSearchParams({
            q: `'${folderId}' in parents and trashed = false`,
            key: cfg.apiKey,
            fields: DRIVE_FIELDS,
            pageSize: '1000',
            supportsAllDrives: 'true',
            includeItemsFromAllDrives: 'true'
        });
        const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Drive list error ${res.status}`);
        const json = await res.json();
        return json.files || [];
    }

    function isFolder(item) {
        return item.mimeType === 'application/vnd.google-apps.folder';
    }

    function isImage(item) {
        return item.mimeType && item.mimeType.startsWith(IMAGE_MIME_PREFIX);
    }

    async function getSubfolders(folderId) {
        const items = await driveListFolder(folderId);
        return items.filter(isFolder);
    }

    async function getImages(folderId) {
        const items = await driveListFolder(folderId);
        return items.filter(isImage);
    }

    async function buildProductFromFolder(folder, collectionId) {
        const images = await getImages(folder.id);
        if (images.length === 0) return null;
        // Use thumbnailLink as a fast-loading image; you can also build download URLs if needed
        const mainImage = images[0].thumbnailLink || images[0].webViewLink;
        const allImages = images.map(img => img.thumbnailLink || img.webViewLink);
        return {
            id: hashId(folder.id),
            name: folder.name,
            material: '',
            type: 'rings',
            category: 'silver',
            collection: collectionId || undefined,
            image: mainImage,
            images: allImages
        };
    }

    function hashId(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i), h |= 0;
        return Math.abs(h);
    }

    async function buildCollectionsAndProducts() {
        const cfg = getConfig();
        if (!cfg.enabled) return null;
        const collections = [];
        const products = [];

        // Collections path: CollectionsRoot/{Collection}/{ProductFolder}
        if (cfg.rootFolders.collections) {
            const collectionFolders = await getSubfolders(cfg.rootFolders.collections);
            for (const cf of collectionFolders) {
                const collectionId = cf.name.toLowerCase().replace(/\s+/g, '-');
                collections.push({
                    id: collectionId,
                    name: cf.name,
                    description: '',
                    image: ''
                });
                const productFolders = await getSubfolders(cf.id);
                for (const pf of productFolders) {
                    const p = await buildProductFromFolder(pf, collectionId);
                    if (p) products.push(p);
                }
            }
        }

        // Non-collection products: NonCollectionsRoot/{ProductFolder}
        if (cfg.rootFolders.nonCollections) {
            const productFolders = await getSubfolders(cfg.rootFolders.nonCollections);
            for (const pf of productFolders) {
                const p = await buildProductFromFolder(pf, undefined);
                if (p) products.push(p);
            }
        }

        return { products, collections };
    }

    window.IuveneDrive = {
        buildCollectionsAndProducts
    };
})();


