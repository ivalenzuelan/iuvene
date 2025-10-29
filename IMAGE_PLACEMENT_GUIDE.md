# 📁 Image Placement Guide - Iuvene Jewelry

## 🎯 **Simple Rule: ALL Images Go in the `images/` Folder**

I've cleaned up the confusion! Now you have **one simple folder structure** for all your images.

## 📂 **Current Clean Structure:**

```
iuvene/                          ← Your main project folder
├── images/                      ← 🎯 ALL images go here
│   ├── hero-background.jpg     ← Main hero image
│   ├── collection-*.jpg        ← Collection images
│   ├── product-*.jpg           ← Product images
│   └── workshop.jpg            ← About section image
├── data/
│   └── products.json           ← Product data
├── index.html                  ← Main website
└── css/style.css               ← Styling
```

## ✅ **Where to Place Images:**

### **1. Product Images** → `images/` folder
- **Main photos**: `product-fluid-ring.jpg`, `product-necklace.jpg`
- **Additional angles**: `product-fluid-ring-2.jpg`, `product-fluid-ring-3.jpg`
- **Size**: 600x600px (square) recommended
- **Format**: JPG or PNG

### **2. Collection Images** → `images/` folder
- **Collection covers**: `collection-oceana.jpg`, `collection-everyday.jpg`
- **Size**: Any size (will be styled by CSS)
- **Format**: JPG or PNG

### **3. Website Images** → `images/` folder
- **Hero background**: `hero-background.jpg`
- **About section**: `workshop.jpg`
- **Any other images**: All go in the same `images/` folder

## 🚀 **How to Add New Images:**

### **Step 1: Save Image in `images/` folder**
```
iuvene/images/your-new-image.jpg
```

### **Step 2: Reference in JSON**
```json
{
  "id": 7,
  "name": "New Necklace",
  "image": "images/your-new-image.jpg",        ← This path
  "images": [
    "images/your-new-image.jpg",               ← And this path
    "images/your-new-image-2.jpg"
  ]
}
```

### **Step 3: That's it!** ✨

## 🔍 **What I Fixed:**

### **Before (Confusing):**
- ❌ `iuvene-jewelry/images/` (old folder)
- ❌ `images/` (root folder)
- ❌ Website looking in wrong place
- ❌ Images not showing correctly

### **After (Clean):**
- ✅ **Only ONE `images/` folder**
- ✅ **All images in the right place**
- ✅ **Website finds images correctly**
- ✅ **Simple, logical structure**

## 🌟 **Benefits of Clean Structure:**

- **No confusion** - only one place for images
- **Easy to manage** - all images in one folder
- **Simple paths** - always just `images/filename.jpg`
- **Easy to backup** - just copy the `images/` folder
- **Works perfectly** - website finds all images

## 📝 **Example: Adding a New Product**

### **1. Save your photo as:**
```
iuvene/images/product-summer-necklace.jpg
```

### **2. Update JSON:**
```json
{
  "id": 7,
  "name": "Summer Necklace",
  "image": "images/product-summer-necklace.jpg",
  "images": [
    "images/product-summer-necklace.jpg"
  ]
}
```

### **3. Save and refresh website** ✨

## 🚨 **Important Rules:**

- ✅ **ALL images go in the `images/` folder**
- ✅ **Paths always start with `images/`** (not `/images/` or `../images/`)
- ✅ **No subfolders needed** - keep it simple
- ✅ **File names matter** - must match exactly what you write in JSON

## 🔄 **Quick Checklist:**

1. **Save image** in `iuvene/images/` folder
2. **Update JSON** with `images/filename.jpg` path
3. **Save JSON file**
4. **Refresh website**
5. **Image appears!** ✨

---

**🎉 No more confusion!**

Now you have **one simple rule**: put all images in the `images/` folder, and reference them as `images/filename.jpg` in your JSON. That's it! 🎯
