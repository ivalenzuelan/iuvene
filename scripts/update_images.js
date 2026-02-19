
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

// --- CONFIGURATION ---
// I will replace these with values read from product-manager.js
const SUPABASE_URL = 'https://ekjlewkhubalcdwwtmjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramxld2todWJhbGNkd3d0bWp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTk1NDksImV4cCI6MjA4NzAzNTU0OX0.iI2K0RY1s-tA3P2xu6IhmOch7YldfrTNw1wCzdE6o08';
const STORAGE_BUCKET = 'product-images';
const BASE_LOCAL_PATH = './images/newImages/Colección';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadFile(localPath, storagePath) {
    const fileContent = fs.readFileSync(localPath);
    const contentType = mime.lookup(localPath) || 'application/octet-stream';

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, fileContent, {
            contentType: contentType,
            upsert: true
        });

    if (error) {
        console.error(`Error uploading ${localPath}:`, error.message);
        return null;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath);

    return publicUrl;
}

const MANUAL_MAPPING = {
    'Chocker Nuria': 'Chocker Nuri',
    'Chocker Mónica': 'Chocker Moni',
    'Chocker Monica': 'Chocker Moni',
    'Chocker Mónica': 'Chocker Moni',
    'Chocker Clau': 'Chocker Claudia',
    'Collar Susana': 'Collar Susana',
    'Chocker Isabel': 'Chocker Isa',
    'Chocker Lucía': 'Chocker Lucía', // Decomposed to Composed
    'Chocker Lucia': 'Chocker Lucía'
};

function sanitizeKey(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.-]/g, "_");
}

async function processProductFolder(folderName, parentDir) {
    console.log(`Processing product folder: ${folderName}`);
    const fullPath = path.join(parentDir, folderName);
    const files = fs.readdirSync(fullPath).filter(f => !f.startsWith('.')); // Ignore hidden files

    if (files.length === 0) {
        console.log(`  No images found in ${folderName}`);
        return;
    }

    const imageUrls = [];

    // DB Lookup Name
    // Normalize to NFC (composed) to match Database usually
    let dbNameSearch = folderName.normalize('NFC');

    if (MANUAL_MAPPING[folderName] || MANUAL_MAPPING[dbNameSearch]) {
        dbNameSearch = MANUAL_MAPPING[folderName] || MANUAL_MAPPING[dbNameSearch];
        console.log(`  Mapped "${folderName}" -> "${dbNameSearch}" for DB lookup`);
    }

    // Sanitize folder name for Storage Key to avoid "Invalid Key" errors
    const sanitizedFolderName = sanitizeKey(folderName);

    for (const file of files) {
        const localFilePath = path.join(fullPath, file);
        const cleanFileName = sanitizeKey(file);

        // Use sanitized folder name in the S3 path
        const storagePath = `ProductsCollections/ColeccionIuvene/${sanitizedFolderName}/${cleanFileName}`;

        console.log(`  Uploading ${file} -> ${storagePath}...`);
        const url = await uploadFile(localFilePath, storagePath);
        if (url) imageUrls.push(url);
    }

    if (imageUrls.length > 0) {
        // Update Database
        // Try to find product by exact name match first
        // If folder is "Chocker Ana", look for "Chocker Ana"

        // Handling the "Chocker " prefix or lack thereof might be tricky if names don't match 1:1
        // But assuming folders "Chocker Ana" match product "Chocker Ana"

        const mainImage = imageUrls[0]; // Logic: First image is main

        // Search DB
        const { data: products, error: searchError } = await supabase
            .from('products')
            .select('id, name')
            .ilike('name', dbNameSearch); // Case-insensitive match

        if (searchError) {
            console.error(`  Error searching product ${dbNameSearch}:`, searchError.message);
            return;
        }

        if (products.length === 0) {
            // Try fuzzy search? Or just warn.
            // Try removing "Chocker " prefix?
            if (dbNameSearch.startsWith('Chocker ')) {
                const shortName = dbNameSearch.replace('Chocker ', '');
                console.log(`  Retrying search with short name: "${shortName}"...`);
                const { data: productsRetry } = await supabase
                    .from('products')
                    .select('id, name')
                    .ilike('name', shortName);

                if (productsRetry && productsRetry.length > 0) {
                    products.push(...productsRetry);
                }
            }
        }

        if (products.length === 0) {
            console.warn(`  WARNING: Product "${dbNameSearch}" not found in database. Skipping DB update.`);
            return;
        }

        for (const product of products) {
            console.log(`  Updating product ${product.name} (ID: ${product.id})...`);

            const updatePayload = {
                image: mainImage,
                images: imageUrls
            };

            const { error: updateError } = await supabase
                .from('products')
                .update(updatePayload)
                .eq('id', product.id);

            if (updateError) {
                console.error(`  Error updating product ${product.id}:`, updateError.message);
            } else {
                console.log(`  SUCCESS: Updated images for ${product.name}`);
            }
        }
    }
}

async function main() {
    const categories = ['Chockers', 'Collares'];

    for (const category of categories) {
        const categoryPath = path.join(BASE_LOCAL_PATH, category);
        if (!fs.existsSync(categoryPath)) {
            console.warn(`Category folder not found: ${categoryPath}`);
            continue;
        }

        const productFolders = fs.readdirSync(categoryPath).filter(f => {
            return fs.statSync(path.join(categoryPath, f)).isDirectory();
        });

        for (const folder of productFolders) {
            await processProductFolder(folder, categoryPath);
        }
    }
}

main();
