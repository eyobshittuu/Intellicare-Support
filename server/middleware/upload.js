const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || 
    !process.env.CLOUDINARY_API_KEY || 
    !process.env.CLOUDINARY_API_SECRET) {
  console.error('⚠️  WARNING: Cloudinary credentials missing in environment variables');
  console.error('   CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✓ Set' : '✗ Missing');
  console.error('   CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
  console.error('   CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');
  console.error('   Image uploads will not work until all credentials are configured');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log successful configuration (without exposing secrets)
if (process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET) {
  console.log('✅ Cloudinary configured successfully');
  console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on file type
    const isImage = /^image\//.test(file.mimetype);
    
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
    const ext = path.extname(file.originalname).toLowerCase();
    
    return {
      folder: 'intellicare-tickets',
      resource_type: isImage ? 'image' : 'auto', // Changed from 'raw' to 'auto'
      type: 'upload', // Explicitly set type to 'upload' (not 'authenticated')
      access_mode: 'public', // Make files publicly accessible
      public_id: `${nameWithoutExt}-${uniqueSuffix}`,
      // Only apply transformation to images
      ...(isImage && {
        transformation: [{ width: 1500, height: 1500, crop: 'limit' }]
      }),
      // Don't specify format for non-images - let Cloudinary auto-detect
      ...(!isImage && { flags: 'attachment' }), // Force download for non-images
      // Store original filename in context
      context: `original_filename=${file.originalname}`
    };
  }
});

// File filter - allow all common file types
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|csv|txt|zip|rar|7z|tar|gz/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // Allowed MIME types
  const allowedMimeTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documents
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv', 'text/plain',
    // Archives
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/vnd.rar',
    'application/x-7z-compressed',
    'application/x-tar', 'application/gzip'
  ];
  
  const mimetypeValid = allowedMimeTypes.includes(file.mimetype) || 
                        file.mimetype.startsWith('application/vnd.') || // Excel/Word variants
                        file.mimetype.startsWith('application/x-'); // Archive variants

  if (mimetypeValid || extname) {
    return cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed types: Images (JPEG, PNG, GIF, WebP), Documents (PDF, Word, Excel, CSV, TXT), Archives (ZIP, RAR, 7Z, TAR, GZ)`));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size (increased for documents/archives)
  },
  fileFilter: fileFilter
});

// Add error handling wrapper
const uploadWithErrorHandling = (req, res, next) => {
  const uploadMiddleware = upload.array('images', 5);
  
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error('=== UPLOAD MIDDLEWARE ERROR ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB per file.'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum is 5 files.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`
        });
      } else {
        // Other errors (e.g., Cloudinary errors)
        return res.status(500).json({
          success: false,
          message: `Upload failed: ${err.message}`
        });
      }
    }
    
    console.log('Upload middleware passed. Files:', req.files?.length || 0);
    next();
  });
};

module.exports = uploadWithErrorHandling;
