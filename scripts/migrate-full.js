
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
const SUPABASE_URL = 'https://ekjlewkhubalcdwwtmjv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramxld2todWJhbGNkd3d0bWp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ1OTU0OSwiZXhwIjoyMDg3MDM1NTQ5fQ.WHZ67WSs1s8OVYopyou8-xn4RwGj-vGX_35y0RjlCFs';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const JSON_PATH = path.join(__dirname, '../data/products-custom.json');

async function migrate() {
    console.log('🚀 Starting migration...');

    // Read JSON
    const rawData = fs.readFileSync(JSON_PATH);
    const data = JSON.parse(rawData);

    // 1. Migrate Collections
    console.log(`\n📦 Migrating ${data.collections.length} collections...`);
    for (const collection of data.collections) {
        console.log(`Processing collection: ${collection.name}`);

        // Upload image if it's a local path
        let imageUrl = collection.image;
        if (collection.image && !collection.image.startsWith('http')) {
            imageUrl = await uploadImage(collection.image);
        }

        const { error } = await supabase.from('collections').upsert({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            image: imageUrl
        });

        if (error) console.error(`❌ Error migrating collection ${collection.name}:`, error.message);
        else console.log(`✅ Collection ${collection.name} migrated.`);
    }

    // 2. Migrate Products
    console.log(`\n💎 Migrating ${data.products.length} products...`);
    for (const product of data.products) {
        console.log(`Processing product: ${product.name}`);

        // Upload main image
        let mainImageUrl = product.image;
        if (product.image && !product.image.startsWith('http')) {
            mainImageUrl = await uploadImage(product.image);
        }

        // Upload gallery images
        let galleryUrls = [];
        if (product.images && product.images.length > 0) {
            for (const imgPath of product.images) {
                if (imgPath && !imgPath.startsWith('http')) {
                    const url = await uploadImage(imgPath);
                    if (url) galleryUrls.push(url);
                } else {
                    galleryUrls.push(imgPath);
                }
            }
        }

        // Upsert product
        const productData = {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            material: product.material,
            category: product.category, // 'silver', 'gold'
            type: product.type, // 'rings', 'earrings', etc
            collection_id: product.collection, // Map 'collection' string to 'collection_id'
            image: mainImageUrl, // snake_case in DB? No, updated schema uses 'image' based on admin.js?
            // Wait, check admin.js schema usage:
            // supabase.from('products').select('*') results have: image, name, price...
            // It seems the columns are 'image', 'images' (array?)
            // Let's assume schema matches JSON keys mostly, except snake_case conversion if needed.
            // Previous session summary said: "Refactored... to filter products using p.collection_id...".
            // So DB col is collection_id.
            sold_out: product.soldOut,
            show_on_dashboard: product.showOnDashboard,
            images: galleryUrls,
            tags: product.tags
        };

        const { error } = await supabase.from('products').upsert(productData);

        if (error) console.error(`❌ Error migrating product ${product.name}:`, error.message);
        else console.log(`✅ Product ${product.name} migrated.`);
    }
}

async function uploadImage(localPath) {
    try {
        // Resolve absolute path
        const absolutePath = path.resolve(__dirname, '..', localPath);

        if (!fs.existsSync(absolutePath)) {
            console.warn(`⚠️ File not found: ${localPath}`);
            return null;
        }

        const fileBuffer = fs.readFileSync(absolutePath);
        const fileName = path.basename(localPath);
        // Create a unique path in bucket to avoid collisions or simple overwrites
        // Use original info to keep structure: ProductsCollections/Coleccion...
        // Remove 'images/' prefix for cleaner bucket path
        const bucketPath = localPath.replace(/^images\//, '');

        const { data, error } = await supabase.storage
            .from('product-images')
            .upload(bucketPath, fileBuffer, {
                upsert: true,
                contentType: getContentType(fileName)
            });

        if (error) {
            console.error(`❌ Storage Upload Error (${fileName}):`, error.message);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(bucketPath);

        return publicUrl;
    } catch (e) {
        console.error(`❌ Exception uploading ${localPath}:`, e.message);
        return null;
    }
}

function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.png') return 'image/png';
    if (ext === '.webp') return 'image/webp';
    return 'application/octet-stream';
}

migrate();
