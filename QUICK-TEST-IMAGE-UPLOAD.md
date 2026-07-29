# Quick Test: Image Upload Feature

## 🎯 What's New:

Users can now **upload images** when creating tickets to show what the problem looks like!

---

## ✅ Current Status:

- ✅ Server running with image upload support
- ✅ Client running with new UI
- ✅ File upload middleware configured
- ✅ Image storage ready
- ✅ Display functionality added

---

## 🧪 How to Test Right Now:

### Step 1: Open the App
```
http://localhost:5173
```

### Step 2: Login
Use your credentials

### Step 3: Create a New Ticket
1. Click "Tickets" in sidebar
2. Click "Create New Ticket" button
3. Fill in the form:
   - Title: "Test ticket with images"
   - Hospital: Select any
   - Category: "Technical Issue"
   - Description: "Testing image upload feature"

### Step 4: Upload Images
1. Scroll to **"Attachments (Optional)"** section
2. **Click** the upload area OR **drag and drop** images
3. You can upload up to **5 images**
4. See **instant previews** of your images
5. Each image shows file size
6. Click **X** on any image to remove it

### Step 5: Submit
1. Click "Create Ticket"
2. Wait for success message
3. Automatically redirected to tickets list

### Step 6: View the Ticket
1. Click on your new ticket
2. Go to **"Details"** tab
3. Scroll down to see **"Attachments"** section
4. See your uploaded images in a grid
5. **Hover** over image to see filename and size
6. **Click** image to view full size in new tab

---

## 📋 What to Upload:

### Good Test Images:
- Screenshots of errors
- Photos of hardware issues
- Diagrams
- Any image file (JPEG, PNG, GIF, WebP)

### File Requirements:
- ✅ Max 5MB per image
- ✅ Up to 5 images total
- ✅ Image formats only

---

## 🎨 What You'll See:

### Upload Area:
```
┌─────────────────────────────────┐
│         📤 Upload Icon           │
│                                  │
│  Click to upload or drag & drop  │
│                                  │
│  PNG, JPG, GIF, WebP            │
│  (Max 5MB each, up to 5 images) │
└─────────────────────────────────┘
```

### Image Previews:
```
┌──────┐ ┌──────┐ ┌──────┐
│[IMG] │ │[IMG] │ │[IMG] │
│ X    │ │ X    │ │ X    │
│245 KB│ │156 KB│ │892 KB│
└──────┘ └──────┘ └──────┘

3 images selected (You can add more)
```

### In Ticket Details:
```
Attachments (3)
┌────────┐ ┌────────┐ ┌────────┐
│        │ │        │ │        │
│ Image1 │ │ Image2 │ │ Image3 │
│        │ │        │ │        │
│(hover) │ │        │ │        │
│245 KB  │ │        │ │        │
└────────┘ └────────┘ └────────┘
```

---

## ⚠️ Test Error Cases:

### Try These (They Should Show Errors):

1. **Upload 6 images**
   - Should say: "You can upload maximum 5 images"

2. **Upload file >5MB**
   - Should say: "Each image must be less than 5MB"

3. **Upload non-image file** (.txt, .pdf, .doc)
   - Should say: "Only image files are allowed"

---

## 📊 Where Files Are Stored:

### Locally:
```
server/uploads/tickets/
├── screenshot-1706543210123-987654321.png
├── error-1706543210124-123456789.jpg
└── diagram-1706543210125-456789123.png
```

### Database:
- Ticket record contains `attachments` JSON field
- Stores metadata (filename, path, size, type, etc.)

---

## 🔍 Troubleshooting:

### Images Not Uploading?
1. Check console (F12) for errors
2. Verify file size is under 5MB
3. Ensure file is an image format
4. Check server is running

### Images Not Displaying?
1. Check if ticket has attachments field
2. Verify `/uploads/` folder exists
3. Check browser console for 404 errors
4. Verify server serving static files

### Preview Not Showing?
1. Check browser console for errors
2. Verify file is valid image
3. Try different image format
4. Refresh page

---

## ✅ Success Indicators:

You'll know it's working when:

1. ✅ Upload area appears below description
2. ✅ Can click/drag images to upload
3. ✅ Previews appear immediately
4. ✅ Can remove previews before submitting
5. ✅ Ticket creates successfully
6. ✅ Images appear in ticket details
7. ✅ Can click to view full size
8. ✅ File info shows on hover

---

## 🚀 Ready to Deploy?

Once you're satisfied with testing:

```bash
# Commit changes
git add .
git commit -m "Add image upload feature for tickets"

# Push to production
git push origin main
```

---

## 📚 Full Documentation:

See `IMAGE-UPLOAD-FEATURE.md` for complete technical details.

---

**Current Status**: ✅ Feature complete and running locally!

**Next Action**: Test it now by creating a ticket with images!
