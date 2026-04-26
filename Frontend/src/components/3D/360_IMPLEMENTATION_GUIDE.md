# 360-Degree Property View Implementation Guide

## 🎯 Overview

This guide helps you implement 360-degree property views in your JaggaDalal real estate platform using **Panellum**, the best choice for your use case.

---

## 📊 Why Panellum is Best for Your Project

| Feature | Panellum | Three.js | Matterport |
|---------|----------|----------|-----------|
| Learning Curve | ⭐ Easy | ⭐⭐⭐ Hard | ⭐⭐⭐ Hard |
| File Size | 50KB | 500KB+ | Cloud-based |
| Setup Time | 5 mins | 30+ mins | Days |
| Cost | Free | Free | $$$$ |
| Mobile Support | ✅ Great | ✅ Good | ✅ Best |
| Real Estate Focus | ✅ Perfect | ✅ Good | ✅ Best |

---

## 🚀 Implementation Steps

### Step 1: Upload 360-Degree Images to Cloudinary

**How users can get 360 images:**

1. **Smartphone Panorama Mode**
   - Use phone's built-in panorama mode
   - Scan room horizontally (slower = better quality)
   - Save as high-res image

2. **360 Camera**
   - Ricoh Theta X, Insta360, Samsung Gear 360
   - Takes full 360-degree photos automatically
   - Output: Equirectangular format images

3. **Online Tools**
   - Use smartphone photos with stitching software
   - Apps: Microsoft ICE, Hugin (free)

**Required Image Format:**
- Equirectangular projection (standard 360 format)
- Minimum: 2048×1024 pixels (Recommended: 4096×2048)
- Formats: JPEG, PNG, WebP

### Step 2: Use the Component

```jsx
import Property360Viewer from "../components/3D/Property360Viewer";

// In your PropertyDetails page:
<Property360Viewer 
  image360Url="https://res.cloudinary.com/your-cloud/image/upload/v123/property-360.jpg"
  title="Living Room 360 View"
  autoRotate={true}
  showControls={true}
  height="500px"
/>
```

### Step 3: Integrate with Cloudinary Upload

Add 360 image support to your property upload form:

```jsx
// In your PropertyFormModal or property creation form:

const handleAdd360Image = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "your_preset");
  formData.append("tags", "property-360"); // Tag for easy filtering
  
  try {
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/your-cloud/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await response.json();
    setProperty360Url(data.secure_url);
  } catch (error) {
    console.error("Error uploading 360 image:", error);
  }
};
```

---

## 📱 User Controls

| Action | How |
|--------|-----|
| Rotate View | Click & drag with mouse |
| Zoom In/Out | Scroll wheel or pinch gesture |
| Auto-Rotate | Enabled by default, click to pause |
| Fullscreen | Click fullscreen icon (bottom-right) |
| Mobile | Tilt device (if enabled) |

---

## 🛠️ Configuration Options

```jsx
<Property360Viewer 
  image360Url={url}
  title="Living Room"
  autoRotate={true}           // Auto-rotate on load
  showControls={true}         // Show UI controls
  height="500px"              // Container height
/>
```

### Advanced Configuration (if needed):

```javascript
{
  type: 'equirectangular',      // Image type
  panorama: imageUrl,           // 360 image URL
  autoLoad: true,               // Auto-load on init
  autoRotate: -2,               // Rotation speed (-2 = slow, 0 = off)
  pitch: 0,                     // Initial vertical angle
  yaw: 0,                       // Initial horizontal angle
  hfov: 110,                    // Initial horizontal field of view
  minHfov: 50,                  // Minimum zoom out
  maxHfov: 120,                 // Maximum zoom in
  mouseZoom: true,              // Enable mouse zoom
  showZoomCtrl: true,           // Show zoom buttons
  showFullscreenCtrl: true,      // Show fullscreen button
}
```

---

## 💾 Database Updates

Add 360 image field to your Property model:

```javascript
// In Backend/src/models/Property.js
propertySchema.add({
  image360Url: {
    type: String,
    description: "360-degree panoramic image URL"
  },
  image360RoomType: {
    type: String,
    enum: ["living-room", "bedroom", "kitchen", "bathroom", "exterior", "other"],
    description: "Which room/area the 360 image shows"
  }
});
```

---

## 🎬 Multiple 360 Views (Advanced)

For properties with multiple 360 images (each room):

```jsx
import { useState } from 'react';
import Property360Viewer from "../components/3D/Property360Viewer";

export function MultiRoom360Gallery({ property }) {
  const [activeRoom, setActiveRoom] = useState(0);
  
  const rooms = [
    { name: "Living Room", url: property.image360LivingRoom },
    { name: "Master Bedroom", url: property.image360Bedroom },
    { name: "Kitchen", url: property.image360Kitchen },
  ];
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {rooms.map((room, idx) => (
          <button
            key={idx}
            onClick={() => setActiveRoom(idx)}
            className={`px-4 py-2 rounded ${
              activeRoom === idx 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-300'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>
      
      <Property360Viewer 
        image360Url={rooms[activeRoom].url}
        title={rooms[activeRoom].name}
      />
    </div>
  );
}
```

---

## 📤 Uploading 360 Images - User Guide

**For Property Sellers:**

1. Take a panoramic photo or use a 360 camera
2. Upload to property listing
3. System automatically detects equirectangular images
4. Choose room type (living room, bedroom, etc.)
5. Save - 360 view is now live!

---

## 🚨 Troubleshooting

### Image Doesn't Appear
- ✅ Check URL is HTTPS (Panellum requires secure URLs)
- ✅ Verify image is in equirectangular format
- ✅ Check browser console for errors

### Distorted Image
- ✅ Ensure image is equirectangular, not regular panorama
- ✅ Use proper aspect ratio (2:1, e.g., 4096×2048)

### Slow Performance
- ✅ Compress images using Cloudinary transformations
- ✅ Use smaller dimensions on mobile

---

## 💡 Pro Tips

1. **Mobile Optimization:**
   ```jsx
   <Property360Viewer
     height={window.innerWidth < 768 ? "300px" : "500px"}
   />
   ```

2. **Loading States:**
   ```jsx
   {loading ? <LoadingSpinner /> : <Property360Viewer ... />}
   ```

3. **Lazy Loading:**
   ```jsx
   <div data-component="360-viewer" data-image={url} />
   // Initialize only when visible
   ```

4. **Track User Engagement:**
   ```javascript
   viewer.on('fullscreen-open', () => {
     // Analytics tracking
     trackEvent('360-view-fullscreen');
   });
   ```

---

## 🔄 Future Enhancements

1. **Add Hotspots** - Click on areas to get info
2. **Floor Plan Navigation** - Jump between rooms
3. **Virtual Tour** - Auto-guided property tour
4. **VR Mode** - Cardboard VR support
5. **Annotations** - Add text/audio notes

---

## 📚 Resources

- **Panellum Documentation:** https://pannellum.org/documentation/overview/
- **Creating 360 Images:** https://www.ricoh360.com/en/
- **Cloudinary Upload:** https://cloudinary.com/documentation/image_upload_api

---

## 🤝 Next Steps

1. ✅ Component created: `Frontend/src/components/3D/Property360Viewer.jsx`
2. ⏭️ Update Property model with `image360Url` field
3. ⏭️ Add 360 image upload to property form
4. ⏭️ Display 360 viewer in PropertyDetails page
5. ⏭️ Create user guide for uploaders
