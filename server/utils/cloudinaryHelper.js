const cloudinary = require('cloudinary').v2;

/**
 * Generate a signed URL for Cloudinary resources
 * This is needed for raw files (PDFs, Word, Excel, etc.) to be publicly accessible
 */
function generateSignedUrl(publicId, resourceType = 'raw') {
  try {
    // Generate a signed URL that expires in 1 year
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year from now
    });
    
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

/**
 * Get the appropriate URL for a file based on its type
 * Images use direct URLs, raw files use signed URLs
 */
function getPublicUrl(file) {
  const isImage = file.mimetype && file.mimetype.startsWith('image/');
  
  if (isImage) {
    // Images can use direct URL
    return file.path;
  } else {
    // Raw files need signed URLs
    return generateSignedUrl(file.filename, 'raw');
  }
}

module.exports = {
  generateSignedUrl,
  getPublicUrl
};
