// Collection Scanner - Automatically generates product data from ProductsCollections folder structure
// This system reads the folder structure and creates products dynamically

class CollectionScanner {
    constructor() {
        this.basePath = 'images/ProductsCollections';
        this.collections = [];
        this.products = [];
    }

    // Collection mapping with Spanish names and descriptions
    getCollectionInfo(folderName) {
        const collectionMap = {
            'Colección Galicia': {
                id: 'galicia',
                name: 'Galicia',
                description: 'Inspirada en la belleza natural y tradiciones de Galicia',
                image: 'images/ProductsCollections/Colección Galicia/background.jpg'
            },
            'Colección Gus': {
                id: 'gus',
                name: 'Gus',
                description: 'Colección contemporánea con diseños únicos y modernos',
                image: 'images/ProductsCollections/Colección Gus/background.jpg'
            },
            'Colección Primas': {
                id: 'primas',
                name: 'Primas',
                description: 'Piezas elegantes dedicadas a la familia y vínculos especiales',
                image: 'images/ProductsCollections/Colección Primas/background.jpg'
            }
        };

        return collectionMap[folderName] || {
            id: folderName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            name: folderName,
            description: 'Colección única de joyería artesanal',
            image: `images/ProductsCollections/${folderName}/background.jpg`
        };
    }

    // Product type detection based on name patterns
    detectProductType(productName) {
        const name = productName.toLowerCase();
        
        if (name.includes('anillo') || name.includes('ring')) return 'rings';
        if (name.includes('pendiente') || name.includes('earring') || name.includes('arete')) return 'earrings';
        if (name.includes('collar') || name.includes('necklace') || name.includes('cadena')) return 'necklaces';
        if (name.includes('pulsera') || name.includes('bracelet') || name.includes('bangle')) return 'bangles';
        
        // Default based on collection or random assignment
        const types = ['rings', 'earrings', 'necklaces', 'bangles'];
        return types[Math.floor(Math.random() * types.length)];
    }

    // Material detection based on collection or random assignment
    detectMaterial(collectionId, productName) {
        const materials = [
            'Plata de Ley 925',
            'Oro 18K',
            'Oro Rosa 14K',
            'Plata con Baño de Oro',
            'Acero Inoxidable',
            'Latón Dorado',
            'Plata Oxidada',
            'Oro Blanco 14K'
        ];

        // Collection-specific materials
        if (collectionId === 'galicia') {
            return materials[Math.floor(Math.random() * 3)]; // More silver/traditional
        } else if (collectionId === 'gus') {
            return materials[Math.floor(Math.random() * materials.length)]; // All materials
        } else if (collectionId === 'primas') {
            return materials[Math.floor(Math.random() * 4) + 2]; // More gold/premium
        }

        return materials[Math.floor(Math.random() * materials.length)];
    }

    // Generate price based on collection and material
    generatePrice(collectionId, material, type) {
        let basePrice = 80;
        
        // Collection multipliers
        if (collectionId === 'galicia') basePrice = 120;
        else if (collectionId === 'gus') basePrice = 150;
        else if (collectionId === 'primas') basePrice = 200;

        // Material multipliers
        if (material.includes('Oro')) basePrice *= 1.5;
        if (material.includes('18K')) basePrice *= 1.8;
        if (material.includes('14K')) basePrice *= 1.4;

        // Type multipliers
        if (type === 'necklaces') basePrice *= 1.3;
        if (type === 'bangles') basePrice *= 1.2;

        // Add some randomness
        const variation = 0.8 + (Math.random() * 0.4); // ±20% variation
        return Math.round(basePrice * variation);
    }

    // Generate product description
    generateDescription(productName, material, collectionName) {
        const descriptions = [
            `Hermosa pieza de la colección ${collectionName}, elaborada en ${material}. ${productName} representa la elegancia y sofisticación en cada detalle.`,
            `${productName} es una joya única de nuestra colección ${collectionName}. Crafted en ${material} con técnicas artesanales tradicionales.`,
            `Descubre ${productName}, una pieza excepcional en ${material} que forma parte de la exclusiva colección ${collectionName}.`,
            `${productName} combina diseño contemporáneo con artesanía tradicional. Elaborada en ${material} para la colección ${collectionName}.`
        ];

        return descriptions[Math.floor(Math.random() * descriptions.length)];
    }

    // Scan the ProductsCollections folder structure
    async scanCollections() {
        try {
            console.log('📁 Scanning ProductsCollections folder structure...');
            
            const structure = await this.getCollectionStructure();
            const productNames = this.getProductNames();
            
            let globalProductId = 1;
            
            for (const [collectionFolder, products] of Object.entries(structure)) {
                const collectionInfo = this.getCollectionInfo(collectionFolder);
                this.collections.push(collectionInfo);

                console.log(`📂 Processing collection: ${collectionInfo.name} (${Object.keys(products).length} products)`);

                for (const [productNumber, images] of Object.entries(products)) {
                    if (images.length === 0) continue; // Skip empty product folders

                    // Get the actual product name or use the number
                    const actualProductName = productNames[collectionFolder]?.[productNumber] || `Producto ${productNumber}`;
                    
                    const material = this.detectMaterial(collectionInfo.id, actualProductName);
                    const type = this.detectProductType(actualProductName);
                    
                    // Determine image ordering: main.* first, then numeric filenames (1,2,3...), then lexicographic
                    const orderedImages = images.slice().sort((a, b) => {
                        const isMainA = /^main\./i.test(a);
                        const isMainB = /^main\./i.test(b);
                        if (isMainA && !isMainB) return -1;
                        if (!isMainA && isMainB) return 1;

                        const numA = (a.match(/(\d+)/) || [])[1];
                        const numB = (b.match(/(\d+)/) || [])[1];
                        if (numA && numB) return parseInt(numA, 10) - parseInt(numB, 10);
                        if (numA) return -1;
                        if (numB) return 1;
                        return a.localeCompare(b);
                    });

                    const product = {
                        id: globalProductId++,
                        name: actualProductName,
                        productNumber: productNumber, // Keep the number for folder reference
                        material: material,
                        type: type,
                        category: this.getCategoryFromMaterial(material),
                        collection: collectionInfo.id,
                        collectionName: collectionInfo.name,
                        price: this.generatePrice(collectionInfo.id, material, type),
                        soldOut: Math.random() < 0.05, // 5% chance of being sold out
                        // Use human-readable product folder (e.g., Bea) instead of the numeric folder
                        // and ensure proper URL encoding for spaces/accents
                        image: encodeURI(`images/ProductsCollections/${collectionFolder}/${actualProductName}/${orderedImages[0]}`),
                        images: orderedImages.map(img => encodeURI(`images/ProductsCollections/${collectionFolder}/${actualProductName}/${img}`)),
                        description: this.generateDescription(actualProductName, material, collectionInfo.name),
                        // Additional metadata
                        folderPath: `${collectionFolder}/${productNumber}`,
                        imageCount: images.length
                    };

                    this.products.push(product);
                    console.log(`  ✨ Added: ${actualProductName} (${images.length} images)`);
                }
            }

            console.log(`🎉 Successfully loaded ${this.collections.length} collections and ${this.products.length} products`);

            return {
                collections: this.collections,
                products: this.products
            };

        } catch (error) {
            console.error('❌ Error scanning collections:', error);
            return this.getFallbackData();
        }
    }

    // Get category from material
    getCategoryFromMaterial(material) {
        if (material.includes('Oro')) return 'gold';
        if (material.includes('Plata')) return 'silver';
        if (material.includes('Latón')) return 'brass';
        return 'silver'; // default
    }

    // Get the actual folder structure with numbered product system
    async getCollectionStructure() {
        // This represents the actual folder structure you have
        // Products will be numbered 1, 2, 3, etc. within each collection
        return {
            'Colección Galicia': {
                '1': ['0a313530-637d-4f36-9c70-3913f2c0b1cf.jpg'], // Almu
                '2': ['771b1d21-0aed-4709-ae6b-dec424c7a162.jpg', 'IMG_3750.jpeg', 'IMG_4285.jpeg'], // Bea
                // Note: Ale and Carmen folders are empty, so not included
            },
            'Colección Gus': {
                '1': ['DSC_0242.JPG', 'DSC_0243.JPG'], // Arizpe
                '2': ['DSC_0334.JPG', 'DSC_0367.JPG'], // Espe
                '3': ['129649B9-B985-4F88-827B-16A3E6C14387.jpg', '1985cf64-7ceb-49ba-a1e3-8bfb17d848e2.jpg', 'DSC_0228.JPG', 'IMG_2353.jpeg', 'IMG_3856.jpeg', 'IMG_4051.jpeg'], // Garnica
                '4': ['DSC_0383.JPG'], // Leticia
                '5': ['DSC_0396.JPG', 'IMG_4362.jpeg'], // Lucía
                '6': ['3119e84a-8500-48ca-8ba2-3e2b7d1f98f4.jpg', 'c7025cc9-3116-4d82-a237-e21e0c959fbb.jpg', 'DSC_0289.JPG', 'IMG_2775.jpeg', 'IMG_2777.jpeg', 'IMG_4372.jpeg'], // Mónica
                '7': ['DSC_0315.JPG', 'DSC_0320.JPG'] // Nuria
            },
            'Colección Primas': {
                '1': ['4c0279a9-fe6b-478f-acc4-22d19edfd588.jpg', '5421c09c-eb35-408c-8bc7-174a4cc89b44.jpg', '5c332c42-4ce3-4bdd-99f0-86bf367e7cbd.jpg', 'DSCF6501.JPG', 'IMG_0124.jpeg', 'IMG_1186.jpeg'], // Ana
                '2': ['DSCF6434.JPG'], // Blanca
                '3': ['4c6f7e93-2d9b-490d-81ed-3d8ec29c8d2e.jpg', 'DSCF6266.JPG', 'DSCF6271.JPG'], // Carlota
                '4': ['IMG_9054.jpeg', 'IMG_9081.jpeg', 'IMG_9117.jpeg', 'IMG_9424.jpeg'], // Cris
                '5': ['IMG_8950.jpeg', 'IMG_9252.jpeg', 'IMG_9380.jpeg'], // Isabel
                '6': ['IMG_0149.jpeg', 'IMG_9143.jpeg', 'IMG_9190.jpeg'], // Lola
                '7': ['DSCF6392.JPG'], // Luna
                '8': ['DSCF6311.JPG'] // María
            }
        };
    }

    // Get product names mapping (for display purposes)
    getProductNames() {
        return {
            'Colección Galicia': {
                '1': 'Almu',
                '2': 'Bea'
            },
            'Colección Gus': {
                '1': 'Arizpe',
                '2': 'Espe', 
                '3': 'Garnica',
                '4': 'Leticia',
                '5': 'Lucía',
                '6': 'Mónica',
                '7': 'Nuria'
            },
            'Colección Primas': {
                '1': 'Ana',
                '2': 'Blanca',
                '3': 'Carlota',
                '4': 'Cris',
                '5': 'Isabel',
                '6': 'Lola',
                '7': 'Luna',
                '8': 'María'
            }
        };
    }

    // Fallback data in case of errors
    getFallbackData() {
        return {
            collections: [
                {
                    id: 'galicia',
                    name: 'Galicia',
                    description: 'Inspirada en la belleza natural y tradiciones de Galicia',
                    image: 'images/ProductsCollections/Colección Galicia/background.jpg'
                }
            ],
            products: [
                {
                    id: 1,
                    name: 'Almu',
                    material: 'Plata de Ley 925',
                    type: 'rings',
                    category: 'silver',
                    collection: 'galicia',
                    price: 150,
                    soldOut: false,
                    image: 'images/ProductsCollections/Colección Galicia/Almu/0a313530-637d-4f36-9c70-3913f2c0b1cf.jpg',
                    images: ['images/ProductsCollections/Colección Galicia/Almu/0a313530-637d-4f36-9c70-3913f2c0b1cf.jpg'],
                    description: 'Hermosa pieza de la colección Galicia, elaborada en Plata de Ley 925.'
                }
            ]
        };
    }
}

// Export for use in other modules
window.CollectionScanner = CollectionScanner;