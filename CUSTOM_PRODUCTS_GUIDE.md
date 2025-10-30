# 🎯 Custom Products Management Guide

## 🚀 **Full Control System**

You now have **complete control** over every aspect of your products! The system uses `data/products-custom.json` where you can define:

- ✅ **Custom Names & Descriptions**
- ✅ **Exact Prices**
- ✅ **Image Order (exactly as you want)**
- ✅ **Materials & Categories**
- ✅ **Product Details (weight, dimensions, care)**
- ✅ **Tags & Featured Status**
- ✅ **Sold Out Status**

## 📝 **How to Edit Products**

### **1. Open the Control File:**
```
data/products-custom.json
```

### **2. Edit Any Product:**
```json
{
  "id": 1,
  "name": "Your Custom Name",
  "material": "Your Custom Material",
  "type": "rings|earrings|necklaces|bangles",
  "category": "gold|silver|brass|gemstone",
  "collection": "galicia|gus|primas",
  "price": 299,
  "soldOut": false,
  "description": "Your custom description here...",
  "image": "path/to/main/image.jpg",        ← MAIN CATALOG IMAGE (exterior)
  "images": [
    "path/to/first/image.jpg",    ← First in gallery (usually same as main)
    "path/to/second/image.jpg",   ← Second in gallery
    "path/to/third/image.jpg"     ← Third in gallery
  ],
  "tags": ["custom", "tag1", "tag2"],
  "featured": true,
  "showOnDashboard": true,        ← Controls if product shows on main page
  "weight": "10g",
  "dimensions": "Width: 5mm",
  "care": "Clean with soft cloth"
}
```

## 🎨 **Image Order Control**

### **Perfect Image Control:**
```json
"images": [
  "images/ProductsCollections/Colección Primas/Ana/main-shot.jpg",      ← Shows first
  "images/ProductsCollections/Colección Primas/Ana/angle-view.jpg",     ← Shows second  
  "images/ProductsCollections/Colección Primas/Ana/detail-close.jpg",   ← Shows third
  "images/ProductsCollections/Colección Primas/Ana/lifestyle.jpg"       ← Shows fourth
]
```

**Important**: Use the actual product name as the folder (Ana, Bea, Arizpe, etc.), not numbers!

The **first image** in the array is always the main catalog image. The order in the array is exactly the order they appear in the gallery!

## 💰 **Price & Status Control**

### **Set Exact Prices:**
```json
"price": 150,        ← Shows "€150"
"price": 299.99,     ← Shows "€299.99"
"soldOut": false,    ← Available for purchase
"soldOut": true,     ← Shows "Agotado" badge
```

### **Featured Products:**
```json
"featured": true     ← Gets gold star badge and special styling
```

## 📋 **Product Details**

### **Add Rich Information:**
```json
"weight": "8g",
"dimensions": "Ancho: 6mm, Largo: 25mm",
"care": "Limpiar con paño suave. Evitar perfumes.",
"tags": ["artesanal", "plata", "único", "galicia"]
```

## 🏷️ **Categories & Types**

### **Types (Product Categories):**
- `"rings"` - Anillos
- `"earrings"` - Pendientes  
- `"necklaces"` - Collares
- `"bangles"` - Pulseras

### **Categories (Materials):**
- `"gold"` - Oro (any gold type)
- `"silver"` - Plata (any silver type)
- `"brass"` - Latón
- `"gemstone"` - Piedras preciosas

### **Collections:**
- `"galicia"` - Colección Galicia
- `"gus"` - Colección Gus  
- `"primas"` - Colección Primas

## 🎯 **Quick Examples**

### **Add New Product:**
```json
{
  "id": 9,
  "name": "Nueva Creación",
  "material": "Oro Rosa 18K",
  "type": "rings",
  "category": "gold", 
  "collection": "primas",
  "price": 450,
  "soldOut": false,
  "description": "Anillo único con diseño contemporáneo...",
  "images": [
    "images/ProductsCollections/Colección Primas/Nueva Creación/main.jpg",
    "images/ProductsCollections/Colección Primas/Nueva Creación/detail.jpg"
  ],
  "tags": ["nuevo", "oro rosa", "contemporáneo"],
  "featured": true,
  "weight": "6g",
  "dimensions": "Ancho: 4mm",
  "care": "Resistente al agua"
}
```

### **Update Existing Product:**
Just find the product by ID and change any field:
```json
{
  "id": 1,
  "name": "Almu Renovado",     ← Changed name
  "price": 220,               ← Changed price  
  "description": "Nueva descripción...",  ← Changed description
  "featured": true,           ← Made it featured
  "soldOut": false           ← Back in stock
}
```

### **Reorder Images:**
```json
"images": [
  "images/.../lifestyle.jpg",    ← Now this shows first!
  "images/.../main.jpg",         ← This shows second
  "images/.../detail.jpg"        ← This shows third
]
```

## 🔄 **How It Works**

1. **Priority System**: Custom products file is checked first
2. **Fallback**: If custom file doesn't exist, uses automatic scanner
3. **Live Updates**: Changes appear immediately when you refresh
4. **No Cache**: Custom products bypass cache for instant updates

## 🛠️ **Management Workflow**

### **To Add New Product:**
1. Create product folder: `images/ProductsCollections/Collection Name/Product Name/`
2. Add images to the folder
3. Add product entry to `data/products-custom.json`
4. Set images array in exact order you want (using the product name folder)
5. Refresh website

**Example**: For a new product "Luna" in Colección Primas:
- Folder: `images/ProductsCollections/Colección Primas/Luna/`
- Images: `"images/ProductsCollections/Colección Primas/Luna/main.jpg"`

### **To Update Product:**
1. Open `data/products-custom.json`
2. Find product by ID
3. Change any field (name, price, description, etc.)
4. Save file
5. Refresh website

### **To Reorder Images:**
1. Open `data/products-custom.json`
2. Find product by ID  
3. Reorder the `images` array
4. Save file
5. Refresh website

## 🎨 **Advanced Features**

### **Collection Backgrounds:**
```json
{
  "id": "galicia",
  "name": "Galicia",
  "description": "Your custom collection description",
  "image": "images/ProductsCollections/Colección Galicia/background.jpg"
}
```

### **Rich Descriptions:**
```json
"description": "Anillo único inspirado en las tradiciones gallegas. Elaborado artesanalmente en plata de ley 925 con acabados pulidos que reflejan la luz de manera excepcional. Perfecto para uso diario o ocasiones especiales."
```

### **Multiple Tags:**
```json
"tags": ["artesanal", "plata", "galicia", "único", "tradicional"]
```

## 🚀 **Pro Tips**

1. **Unique IDs**: Always use unique ID numbers for each product
2. **Image Paths**: Double-check image paths are correct
3. **JSON Syntax**: Use online JSON validator if you get errors
4. **Backup**: Keep a backup copy of your custom products file
5. **Testing**: Refresh website after each change to test

## 🔧 **Troubleshooting**

### **Product Not Showing?**
- Check JSON syntax (commas, quotes, brackets)
- Verify image paths exist
- Ensure unique product ID

### **Images Wrong Order?**
- Check `images` array order in JSON
- First image in array = main image
- Array order = gallery order

### **Price Not Showing?**
- Ensure `price` is a number, not string
- Use `299` not `"299"`

---

**🎉 You now have complete control over every aspect of your products!**

Edit `data/products-custom.json` to customize everything exactly as you want it! 🎯## 
🖼️ **How Product Images Work**

### **Two Image Fields Explained:**

#### **1. `"image"` - Main Catalog Image (Exterior)**
```json
"image": "images/ProductsCollections/Colección Primas/Ana/main-photo.jpg"
```
- ✅ **This is the exterior image** that shows on the homepage catalog
- ✅ **Single image path** (not an array)
- ✅ **Most important image** - choose your best product photo
- ✅ **Shows in product cards** on the main page

#### **2. `"images"` - Gallery Images (Interior)**
```json
"images": [
  "images/ProductsCollections/Colección Primas/Ana/main-photo.jpg",    ← Usually same as main
  "images/ProductsCollections/Colección Primas/Ana/angle-view.jpg",    ← Additional angles
  "images/ProductsCollections/Colección Primas/Ana/detail-shot.jpg"    ← Detail shots
]
```
- ✅ **Array of images** for the product detail page gallery
- ✅ **First image** is usually the same as the main `"image"`
- ✅ **Order matters** - array order = gallery order
- ✅ **Multiple images** show when user clicks on product

### **🎯 Quick Fix for Missing Exterior Images:**

If your exterior images aren't showing, check that **both fields** are set:

```json
{
  "id": 1,
  "name": "Product Name",
  "image": "images/ProductsCollections/Collection/Product/best-photo.jpg",  ← ADD THIS!
  "images": [
    "images/ProductsCollections/Collection/Product/best-photo.jpg",         ← Same as above
    "images/ProductsCollections/Collection/Product/other-angle.jpg"
  ]
}
```

### **💡 Pro Tips:**

1. **Same Image Twice**: It's normal to have the same image in both `"image"` and first in `"images"`
2. **Best Photo First**: Use your best, clearest product photo as the main `"image"`
3. **Consistent Quality**: Make sure the main image represents the product well
4. **Square Format**: Main images work best in square format (1:1 ratio)

---

**🔧 The exterior image is controlled by the `"image"` field - make sure it's set for each product!**## 🎛️
 **Dashboard Visibility Control**

### **New Feature: `showOnDashboard` Toggle**

You can now control which products appear on the main homepage while keeping all products available in their collections!

#### **How It Works:**

```json
{
  "id": 1,
  "name": "Product Name",
  "showOnDashboard": true,     ← Shows on main homepage
  "collection": "galicia"
}
```

```json
{
  "id": 2,
  "name": "Another Product", 
  "showOnDashboard": false,    ← Hidden from main homepage
  "collection": "galicia"      ← Still shows when viewing Galicia collection
}
```

### **🎯 Behavior:**

#### **Main Homepage (`showOnDashboard: true`):**
- ✅ Product appears in main catalog
- ✅ Product appears in collection view
- ✅ Product appears in search results
- ✅ Product appears in filters

#### **Hidden from Dashboard (`showOnDashboard: false`):**
- ❌ Product hidden from main catalog
- ✅ Product still appears when viewing specific collection
- ✅ Product still appears in search results within collection
- ✅ Product still accessible via direct link

### **💡 Use Cases:**

#### **Show on Dashboard:**
- ✅ **Best sellers** - your most popular products
- ✅ **New arrivals** - latest additions
- ✅ **Featured items** - products you want to highlight
- ✅ **Representative pieces** - showcase your range

#### **Hide from Dashboard:**
- ❌ **Seasonal items** - show only in collection
- ❌ **Variations** - similar products to avoid clutter
- ❌ **Limited editions** - exclusive to collection browsers
- ❌ **Experimental pieces** - available but not prominently displayed

### **🎨 Current Setup:**

I've configured your products strategically:

#### **Showing on Dashboard (6 products):**
- ✅ **Almu** (Galicia) - Featured piece
- ✅ **Arizpe** (Gus) - Statement necklace
- ✅ **Espe** (Gus) - Elegant ring
- ✅ **Ana** (Primas) - Luxury earrings
- ✅ **Leticia** (Gus) - Contemporary earrings
- ✅ **Lucía** (Gus) - Featured ring

#### **Hidden from Dashboard (6 products):**
- 🔒 **Bea** (Galicia) - Available in collection only
- 🔒 **Garnica** (Gus) - Sold out, hidden from main view
- 🔒 **Blanca** (Primas) - Collection exclusive
- 🔒 **Carlota** (Primas) - Collection exclusive
- 🔒 **Mónica** (Gus) - Collection exclusive
- 🔒 **Cris** (Primas) - Collection exclusive

### **🔧 How to Change:**

#### **To Show Product on Dashboard:**
```json
"showOnDashboard": true
```

#### **To Hide Product from Dashboard:**
```json
"showOnDashboard": false
```

#### **To Show All Products on Dashboard:**
Set all products to `"showOnDashboard": true`

#### **To Create Curated Dashboard:**
Set only your best 4-8 products to `"showOnDashboard": true`

### **🎯 Benefits:**

- ✅ **Cleaner Homepage**: Show only your best products
- ✅ **Reduced Overwhelm**: Visitors see curated selection first
- ✅ **Collection Discovery**: Encourages exploration of collections
- ✅ **Full Access**: All products still accessible via collections
- ✅ **Flexible Control**: Easy to change anytime

---

**💡 Perfect for creating a curated main experience while keeping full product access in collections!**