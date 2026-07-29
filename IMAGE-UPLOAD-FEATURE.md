# Image Upload Feature for Tickets

## ✅ Feature Added!

Users can now upload screenshots or photos when creating a ticket to better illustrate the issue they're reporting.

## 🎯 What Was Added:

### Backend (Server):
✅ **Multer middleware** - Handles multipart/form-data file uploads
✅ **Upload middleware** - Validates file types and sizes
✅ **Ticket model updated** - Added `attachments` JSON field
✅ **Storage system** - Saves files to `server/uploads/tickets/`
✅ **Static file serving** - Serves uploaded images via `/uploads/` route
✅ **Create ticket updated** - Handles image attachments

### Frontend (Client):
✅ **Drag & drop upload** - User-friendly file upload interface
✅ **Image preview** - Shows thumbnails before uploading
✅ **Multiple images** - Upload up to 5 images per ticket
✅ **File validation** - Client-side validation for size and type
✅ **Progress indicator** - Visual feedback during upload
✅ **Image display** - Shows uploaded images in ticket details
✅ **Full-size view** - Click image to open in new tab

---

## 📋 Specifications:

### Upload Limits:
- **Maximum files**: 5 images per ticket
- **Max file size**: 5MB per image
- **Allowed formats**: JPEG, JPG, PNG, GIF, WebP
- **Total storage**: Unlimited (managed by server)

### File Naming:
- Format: `originalname-timestamp-random.ext`
- Example: `screenshot-1706543210123-987654321.png`
- Unique filename prevents conflicts

### Storage Location:
- **Server path**: `server/uploads/tickets/`
- **URL path**: `/uploads/tickets/{filename}`
- **Database**: Stores metadata (filename, size, path, etc.)

---

## 🎨 User Experience:

### Creating a Ticket:

1. **Fill in ticket details** (title, description, hospital, etc.)
2. **Click or drag images** to the upload area
3. **See image previews** with file sizes
4. **Remove unwanted images** by clicking the X button
5. **Submit ticket** - images upload automatically
6. **Success notification** - ticket created with attachments

### Viewing a Ticket:

1. **Open ticket details**
2. **See "Attachments" section** (if images were uploaded)
3. **View image thumbnails** in a grid layout
4. **Hover for filename and size**
5. **Click image** to view full size in new tab

---

## 💾 Database Schema:

### Attachments Field (JSON):
```json
[
  {
    "filename": "screenshot-1706543210123-987654321.png",
    "originalName": "screenshot.png",
    "path": "/uploads/tickets/screenshot-1706543210123-987654321.png",
    "size": 245678,
    "mimetype": "image/png",
    "uploadedAt": "2026-07-29T18:30:00.000Z"
  }
]
```

---

## 🔧 Technical Implementation:

### Backend Files Modified/Created:

1. **`server/middleware/upload.js`** (NEW)
   - Multer configuration
   - File validation
   - Storage settings

2. **`server/models/Ticket.js`** (MODIFIED)
   - Added `attachments` JSON field
   - Stores array of attachment metadata

3. **`server/controllers/ticketController.js`** (MODIFIED)
   - Updated `createTicket` to handle file uploads
   - Saves attachment metadata to database

4. **`server/routes/ticketRoutes.js`** (MODIFIED)
   - Added `upload.array('images', 5)` middleware
   - Processes multipart form data

5. **`server/server.js`** (MODIFIED)
   - Added `express.static('uploads')` middleware
   - Serves uploaded files

6. **`server/package.json`** (MODIFIED)
   - Added `multer` dependency

### Frontend Files Modified:

1. **`client/src/pages/CreateTicket.jsx`** (MODIFIED)
   - Added image upload UI
   - Image preview functionality
   - FormData handling for file upload
   - File validation

2. **`client/src/pages/TicketDetail.jsx`** (MODIFIED)
   - Added attachments display section
   - Image grid layout
   - Full-size image viewer

---

## 🎨 UI Components:

### Upload Area:
- **Drag & drop zone** - Dashed border, hover effects
- **Icon** - Upload cloud icon
- **Instructions** - "Click to upload or drag and drop"
- **Format info** - Shows allowed formats and size limits

### Image Previews:
- **Grid layout** - 2-3 columns responsive
- **Thumbnail size** - 128px height
- **File size badge** - Shows KB/MB
- **Remove button** - Red X button on hover
- **Border** - Gray border, rounded corners

### Attachments Display:
- **Section header** - "Attachments (X)"
- **Grid layout** - 3 columns on desktop
- **Image thumbnails** - 192px height
- **Hover effects** - Border changes to teal
- **Click to enlarge** - Opens in new tab
- **Info overlay** - Filename and size on hover

---

## 🚀 How to Use:

### For Users:

**Creating a Ticket with Images:**

1. Go to "Create Ticket" page
2. Fill in required fields
3. Scroll to "Attachments" section
4. Click the upload area or drag images
5. See image previews appear
6. Remove any unwanted images (click X)
7. Click "Create Ticket"
8. Images upload automatically with ticket

**Viewing Ticket Images:**

1. Open any ticket
2. Go to "Details" tab
3. Scroll to "Attachments" section
4. Click any image to view full size
5. Hover to see filename and size

### For Developers:

**Testing Locally:**

```bash
# Server must be running
cd server
npm run dev

# Client must be running
cd client
npm run dev

# Create a test ticket with images
# Open: http://localhost:5173/tickets/new
```

**Checking Uploaded Files:**

```bash
# Server directory
cd server/uploads/tickets
ls -la

# Files are saved with unique names
```

---

## 📊 API Changes:

### POST /api/tickets

**Before:**
```json
Content-Type: application/json

{
  "title": "Issue title",
  "description": "Issue description",
  "hospital": "Hospital name",
  "category": "Technical Issue",
  "priority": "medium"
}
```

**After:**
```
Content-Type: multipart/form-data

Fields:
- title: "Issue title"
- description: "Issue description"
- hospital: "Hospital name"
- category: "Technical Issue"
- priority: "medium"
- images[]: (file) screenshot1.png
- images[]: (file) screenshot2.png
...up to 5 images
```

**Response (with attachments):**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "id": 1,
    "ticket_number": "TKT-00001",
    "title": "Issue title",
    "description": "Issue description",
    "attachments": [
      {
        "filename": "screenshot-1706543210123-987654321.png",
        "originalName": "screenshot.png",
        "path": "/uploads/tickets/screenshot-1706543210123-987654321.png",
        "size": 245678,
        "mimetype": "image/png",
        "uploadedAt": "2026-07-29T18:30:00.000Z"
      }
    ],
    ...other fields
  }
}
```

---

## ✅ Validation:

### Client-Side:
- ✅ File type validation (image formats only)
- ✅ File size validation (5MB max per file)
- ✅ Count validation (5 images max)
- ✅ Visual error messages

### Server-Side:
- ✅ Multer file filter (image types only)
- ✅ File size limit (5MB per file)
- ✅ Array limit (5 files max)
- ✅ Error handling for invalid files

---

## 🔒 Security:

### File Security:
- ✅ File type validation (prevents exe, script uploads)
- ✅ File size limits (prevents DOS attacks)
- ✅ Unique filenames (prevents overwriting)
- ✅ Stored outside web root (uploaded to server/uploads/)
- ✅ Served via Express static (controlled access)

### Access Control:
- ✅ Upload requires authentication
- ✅ Only ticket creator can add attachments
- ✅ All authenticated users can view attachments
- ✅ No public access without login

---

## 📱 Responsive Design:

### Mobile:
- 1 column image grid
- Touch-friendly upload area
- Optimized image thumbnails

### Tablet:
- 2 column image grid
- Medium-sized thumbnails

### Desktop:
- 3 column image grid
- Large thumbnails
- Hover effects

---

## 🐛 Error Handling:

### Upload Errors:
- **File too large**: "Each image must be less than 5MB"
- **Too many files**: "You can upload maximum 5 images"
- **Invalid type**: "Only image files (JPEG, PNG, GIF, WebP) are allowed"
- **Upload failed**: "Failed to create ticket" (with server error)

### Display Errors:
- **Image not found**: Browser shows broken image icon
- **No attachments**: Section hidden if no images
- **Loading error**: Graceful fallback

---

## 🚀 Deployment Notes:

### Production Considerations:

1. **Storage**:
   - Current: Local file system (`server/uploads/`)
   - Recommendation: Use cloud storage (AWS S3, Cloudinary) for production
   - Benefits: Scalability, CDN, backups

2. **Environment Variables**:
   ```
   UPLOAD_DIR=/path/to/uploads
   MAX_FILE_SIZE=5242880  # 5MB in bytes
   MAX_FILES=5
   ```

3. **Database Migration**:
   - `attachments` field will be created automatically by Sequelize
   - Type: JSON (PostgreSQL) or TEXT (MySQL with JSON validation)

4. **Render Deployment**:
   - Uploaded files stored in ephemeral file system
   - Files lost on restart
   - **Action Required**: Integrate cloud storage for production

---

## 📚 Future Enhancements (Optional):

- [ ] Cloud storage integration (AWS S3, Cloudinary)
- [ ] Image compression/optimization
- [ ] More file types (PDFs, documents)
- [ ] Image gallery/lightbox viewer
- [ ] Download all attachments as ZIP
- [ ] Admin ability to remove attachments
- [ ] Image annotations/drawing tools
- [ ] Video upload support
- [ ] Drag to reorder images

---

## 🎉 Summary:

### What Users Get:
✅ Easy image upload when creating tickets
✅ Visual representation of issues
✅ Better communication with support team
✅ Faster issue resolution
✅ Professional ticket system

### What You Built:
✅ Complete file upload system
✅ Image storage and serving
✅ Validation and security
✅ Beautiful UI with previews
✅ Full integration with ticket system

---

## 📖 Testing Checklist:

### Test Upload:
- [ ] Create new ticket
- [ ] Upload 1 image
- [ ] Upload multiple images (up to 5)
- [ ] Try uploading 6 images (should error)
- [ ] Try uploading large file >5MB (should error)
- [ ] Try uploading non-image file (should error)
- [ ] Remove image before submitting
- [ ] Submit ticket with images
- [ ] Verify success message

### Test Display:
- [ ] Open ticket with attachments
- [ ] See attachments section
- [ ] See all uploaded images
- [ ] Hover over image (shows info)
- [ ] Click image (opens full size)
- [ ] Verify image loads correctly
- [ ] Check responsive layout (mobile/tablet/desktop)

### Test Edge Cases:
- [ ] Create ticket without images (should work)
- [ ] Upload same image twice (should work)
- [ ] Very long filename (should work)
- [ ] Special characters in filename (should work)
- [ ] Image with no extension (should error)

---

**Status**: ✅ Feature Complete and Ready to Test!

**Next Step**: Test the image upload feature locally, then deploy to production when satisfied.
