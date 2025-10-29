# Quick Setup Guide - Iuvene Jewelry Website

## 🚀 Getting Started

1. **Open the website**: Double-click `index.html` to open in your browser
2. **View the design**: The website will load with sample products and placeholder images
3. **Test functionality**: Try the filters, shopping cart, and newsletter signup

## 📸 Adding Your Images

### Option 1: Use the Placeholder Generator
1. Open `create-placeholders.html` in your browser
2. Click the buttons to generate placeholder images
3. Right-click each image and "Save image as..." to your `images/` folder
4. Rename the files to match the product names (e.g., `product-fluid-ring.jpg`)

### Option 2: Add Your Own Photos
1. Place your product photos in the `images/` folder
2. Recommended sizes:
   - **Products**: 600x600px (square)
   - **Collections**: 800x450px (landscape)
   - **Workshop**: 800x600px (landscape)
3. Use descriptive filenames (e.g., `product-gold-ring.jpg`)

## 🛍️ Customizing Products

Edit `js/main.js` to add your products:

```javascript
const products = [
    {
        id: 1,
        name: "Your Ring Name",
        material: "14K Gold",
        price: 1200,
        type: "rings",
        category: "gold",
        image: "images/your-ring-image.jpg"
    }
    // Add more products...
];
```

## 🎨 Customizing the Design

### Colors
Edit `css/style.css` to change colors:
- Primary: `#2c2c2c` (Dark Gray)
- Accent: `#8b7355` (Warm Brown)
- Background: `#fafafa` (Light Gray)

### Branding
- Change "Iuvene" to your brand name in `index.html`
- Update the hero text and about section
- Modify contact information and address

## 📱 Testing Responsiveness

1. Open the website in your browser
2. Right-click and "Inspect Element"
3. Click the mobile device icon (📱) in the developer tools
4. Test different screen sizes

## 🚀 Going Live

1. **Upload files** to your web hosting service
2. **Test thoroughly** on different devices
3. **Optimize images** for web (compress JPGs, use WebP if possible)
4. **Add your domain** and SSL certificate

## 🔧 Troubleshooting

### Images not showing?
- Check file paths in `js/main.js`
- Ensure images are in the `images/` folder
- Verify image filenames match exactly

### Cart not working?
- Check browser console for JavaScript errors
- Ensure all files are uploaded together
- Test in a modern browser (Chrome, Firefox, Safari)

### Styling issues?
- Clear browser cache
- Check CSS file is loading
- Verify file permissions on server

## 📞 Need Help?

- Check the `README.md` for detailed documentation
- Review code comments in the files
- Test in different browsers and devices
- Ensure all files are in the correct folder structure

---

**Happy selling!** 🎉✨
