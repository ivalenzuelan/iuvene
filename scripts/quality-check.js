#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');

const DATA_FILES = [
    'data/products.json',
    'data/products-custom.json',
    'data/products-collections.json'
];

const JS_FILES = [
    'js/main.js',
    'js/product-detail.js',
    'js/product-manager.js',
    'js/cart.js',
    'js/newsletter.js',
    'js/performance.js',
    'js/admin.js',
    'sw.js'
];

let errorCount = 0;
let warningCount = 0;

function logSection(title) {
    console.log(`\n=== ${title} ===`);
}

function error(message) {
    errorCount += 1;
    console.error(`✖ ${message}`);
}

function warn(message) {
    warningCount += 1;
    console.warn(`⚠ ${message}`);
}

function ok(message) {
    console.log(`✔ ${message}`);
}

function readJson(filePath) {
    const absolute = path.join(root, filePath);

    if (!fs.existsSync(absolute)) {
        error(`Missing file: ${filePath}`);
        return null;
    }

    try {
        return JSON.parse(fs.readFileSync(absolute, 'utf8'));
    } catch (readError) {
        error(`Invalid JSON in ${filePath}: ${readError.message}`);
        return null;
    }
}

function isRemotePath(filePath) {
    return /^https?:\/\//i.test(filePath);
}

function isLikelyDataUrl(filePath) {
    return /^data:/i.test(filePath);
}

function fileExistsRelative(filePath) {
    const normalized = filePath.replace(/^\//, '');
    const absolute = path.join(root, normalized);
    if (fs.existsSync(absolute)) return true;

    try {
        const decoded = decodeURI(normalized);
        if (decoded !== normalized) {
            return fs.existsSync(path.join(root, decoded));
        }
    } catch (error) {
        // Ignore decodeURI errors and keep original result.
    }

    return false;
}

function validateProductFile(filePath, data) {
    if (!data || !Array.isArray(data.products)) {
        if (!filePath.endsWith('products-collections.json')) {
            warn(`${filePath}: no products array found`);
        }
        return;
    }

    const ids = new Set();

    data.products.forEach((product, index) => {
        const ref = `${filePath}#${index + 1}`;

        if (product.id == null) {
            error(`${ref}: product.id is required`);
        } else {
            const normalizedId = String(product.id);
            if (ids.has(normalizedId)) {
                error(`${ref}: duplicate product.id (${normalizedId})`);
            }
            ids.add(normalizedId);
        }

        if (typeof product.name !== 'string' || !product.name.trim()) {
            error(`${ref}: product.name is required`);
        }

        const collectionId = product.collection ?? product.collection_id;
        if (typeof collectionId !== 'string' || !collectionId.trim()) {
            error(`${ref}: product.collection or product.collection_id is required`);
        }

        const imageCandidates = [];
        if (typeof product.image === 'string' && product.image.trim()) {
            imageCandidates.push(product.image.trim());
        }
        if (Array.isArray(product.images)) {
            product.images.forEach((img) => {
                if (typeof img === 'string' && img.trim()) imageCandidates.push(img.trim());
            });
        }

        if (imageCandidates.length === 0) {
            error(`${ref}: product.image or product.images is required`);
            return;
        }

        const uniqueImages = Array.from(new Set(imageCandidates));
        uniqueImages.forEach((imagePath) => {
            if (isRemotePath(imagePath) || isLikelyDataUrl(imagePath)) return;

            if (!fileExistsRelative(imagePath)) {
                warn(`${ref}: image not found on disk (${imagePath})`);
            }
        });

        if (product.price != null && (!Number.isFinite(Number(product.price)) || Number(product.price) < 0)) {
            error(`${ref}: product.price must be a non-negative number when provided`);
        }
    });

    ok(`${filePath}: validated ${data.products.length} products`);
}

function validateCollections(filePath, data) {
    if (!data || !Array.isArray(data.collections)) return;

    const ids = new Set();
    data.collections.forEach((collection, index) => {
        const ref = `${filePath}#collection-${index + 1}`;
        if (!collection.id) {
            error(`${ref}: collection.id is required`);
            return;
        }

        const id = String(collection.id);
        if (ids.has(id)) {
            error(`${ref}: duplicate collection.id (${id})`);
        }
        ids.add(id);

        if (collection.image && !isRemotePath(collection.image) && !fileExistsRelative(collection.image)) {
            warn(`${ref}: collection image not found on disk (${collection.image})`);
        }
    });
}

function validateManifest(filePath, data) {
    if (!data || !data.collections || typeof data.collections !== 'object') return;

    let products = 0;

    Object.entries(data.collections).forEach(([collectionName, map]) => {
        if (!map || typeof map !== 'object') {
            error(`${filePath}: collection ${collectionName} should map product names to image arrays`);
            return;
        }

        Object.entries(map).forEach(([productName, images]) => {
            products += 1;
            if (!Array.isArray(images) || images.length === 0) {
                error(`${filePath}: ${collectionName}/${productName} must include at least one image filename`);
            }
        });
    });

    ok(`${filePath}: validated ${products} manifest products`);
}

function validateJsSyntax(filePath) {
    const absolute = path.join(root, filePath);

    if (!fs.existsSync(absolute)) {
        error(`Missing JS file: ${filePath}`);
        return;
    }

    const result = spawnSync(process.execPath, ['--check', absolute], {
        encoding: 'utf8'
    });

    if (result.status !== 0) {
        error(`${filePath}: syntax check failed`);
        if (result.stderr) {
            console.error(result.stderr.trim());
        }
        return;
    }

    ok(`${filePath}: syntax OK`);
}

function main() {
    logSection('JSON Validation');

    DATA_FILES.forEach((filePath) => {
        const data = readJson(filePath);
        if (!data) return;

        validateCollections(filePath, data);
        validateProductFile(filePath, data);

        if (filePath.endsWith('products-collections.json')) {
            validateManifest(filePath, data);
        }
    });

    logSection('JavaScript Syntax');
    JS_FILES.forEach(validateJsSyntax);

    logSection('Summary');
    if (errorCount > 0) {
        console.error(`Failed with ${errorCount} error(s) and ${warningCount} warning(s).`);
        process.exit(1);
    }

    console.log(`Passed with ${warningCount} warning(s).`);
}

main();
