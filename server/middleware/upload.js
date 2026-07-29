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
  params: {
    folder: 'intellicare-tickets', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 1500, height: 1500, crop: 'limit' }], // Limit max dimensions
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
      return `${nameWithoutExt}-${uniqueSuffix}`;
    }
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
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
            message: 'File too large. Maximum size is 5MB per file.'
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
