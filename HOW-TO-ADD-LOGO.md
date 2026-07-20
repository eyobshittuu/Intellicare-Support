# How to Add Your IntelliCare Logo

## Quick Steps

### Option 1: Add Logo File (Recommended)

1. **Get your logo file** (PNG, SVG, or JPG format)
   - PNG with transparent background works best
   - Recommended size: 200px wide x 50-60px tall
   - Or SVG for best quality at any size

2. **Place the logo in the public folder:**
   ```
   client/public/logo.png
   ```
   OR
   ```
   client/public/intellicare-logo.svg
   ```

3. **If filename is different**, update the MainLayout.jsx:
   - Open: `client/src/layouts/MainLayout.jsx`
   - Find: `src="/logo.png"`
   - Change to your filename: `src="/your-logo-name.png"`

4. **Refresh browser** - Logo will appear automatically!

### Option 2: Use External URL

If your logo is hosted online:

1. Open `client/src/layouts/MainLayout.jsx`
2. Change this line:
   ```jsx
   src="/logo.png"
   ```
   To:
   ```jsx
   src="https://your-domain.com/path/to/logo.png"
   ```

### Option 3: Import Logo as Module

1. Place logo in: `client/src/assets/logo.png`

2. Add import at top of MainLayout.jsx:
   ```jsx
   import logo from '../assets/logo.png';
   ```

3. Change src to:
   ```jsx
   src={logo}
   ```

## Adjusting Logo Size

### Make Logo Bigger:
```jsx
className="h-10 w-auto"  // Current (40px tall)
className="h-12 w-auto"  // Bigger (48px tall)
className="h-14 w-auto"  // Even bigger (56px tall)
```

### Make Logo Smaller:
```jsx
className="h-8 w-auto"   // Smaller (32px tall)
className="h-6 w-auto"   // Much smaller (24px tall)
```

### Set Specific Width:
```jsx
className="h-10 w-40"    // Fixed width 160px
className="h-10 w-auto"  // Auto width (maintains aspect ratio)
```

## Logo Styling Options

### Add Padding/Margin:
```jsx
className="h-10 w-auto px-2"        // Horizontal padding
className="h-10 w-auto py-1"        // Vertical padding
className="h-10 w-auto mx-2"        // Horizontal margin
```

### Add Background:
```jsx
className="h-10 w-auto bg-white rounded-lg p-2"
```

### Add Border:
```jsx
className="h-10 w-auto border-2 border-white rounded-lg"
```

## Current Setup

The code is ready and will:
✅ Load your logo from `/logo.png`
✅ Auto-scale to 40px height
✅ Maintain aspect ratio
✅ Show fallback text if logo missing
✅ Display properly on all screen sizes

## File Structure

```
client/
├── public/           👈 Put logo here
│   └── logo.png     
├── src/
│   ├── assets/      👈 Or here (needs import)
│   │   └── logo.png
│   └── layouts/
│       └── MainLayout.jsx  👈 Logo code is here
```

## Testing

1. Add your logo file to `client/public/logo.png`
2. Refresh browser: http://localhost:5173/
3. Logo should appear in header
4. If not visible, check browser console for errors

## Troubleshooting

### Logo Not Showing?

1. **Check filename matches**
   - File: `logo.png`
   - Code: `src="/logo.png"`
   - Must match exactly (case-sensitive)

2. **Check file location**
   - Must be in: `client/public/logo.png`
   - NOT in: `server/` folder

3. **Check file format**
   - Supported: PNG, JPG, JPEG, SVG, GIF, WebP
   - Best: PNG or SVG

4. **Clear browser cache**
   - Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

5. **Check browser console**
   - Press F12
   - Look for 404 or image load errors

### Logo Too Big/Small?

Adjust the height class:
```jsx
className="h-8 w-auto"   // Smaller
className="h-10 w-auto"  // Default
className="h-12 w-auto"  // Bigger
className="h-16 w-auto"  // Much bigger
```

### Logo Looks Blurry?

- Use higher resolution image (2x or 3x size)
- Or use SVG format (scales perfectly)
- Ensure logo is at least 200px wide

## Recommended Logo Specs

**Ideal Logo:**
- Format: PNG with transparent background OR SVG
- Size: 400px wide x 100px tall (will scale down)
- Resolution: 2x for retina displays
- File size: Under 100KB
- Colors: Works on teal background (#27B6AF)

**Logo Positioning:**
- Current: Top left of header bar
- Height: 40px (adjustable)
- Alignment: Centered vertically
- Responsive: Scales on mobile

## Need Help?

If you have your logo ready:
1. Tell me the filename
2. I'll update the code to match
3. Or just place it as `client/public/logo.png` and it will work!

## Current Code Location

File: `client/src/layouts/MainLayout.jsx`
Line: Around line 45-55

```jsx
<img 
  src="/logo.png" 
  alt="IntelliCare Support" 
  className="h-10 w-auto"
/>
```

Just replace `/logo.png` with your logo path! 🎨
