const cloudinary = require('cloudinary').v2;

/**
 * Extract public_id from Cloudinary URL
 */
function extractPublicIdFromUrl(url) {
  try {
    // URL format: https://res.cloudinary.com/{cloud}/raw/upload/v{version}/{folder}/{public_id}.{ext}
    const matches = url.match(/\/v\d+\/(.+)$/);
    if (matches && matches[1]) {
      // Remove file extension
      const withoutExt = matches[1].replace(/\.[^.]+$/, '');
      return withoutExt;
    }
    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
}

/**
 * Generate a signed URL for Cloudinary resources
 * This is needed for raw files (PDFs, Word, Excel, etc.) to be publicly accessible
 */
function generateSignedUrl(publicId, resourceType = 'raw') {
  try {
    console.log('Generating signed URL for:', { publicId, resourceType });
    
    // Generate a signed URL that expires in 1 year
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year from now
    });
    
    console.log('Generated signed URL:', signedUrl);
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
  
  console.log('Getting public URL for file:', {
    filename: file.filename,
    path: file.path,
    mimetype: file.mimetype,
    isImage
  });
  
  if (isImage) {
    // Images can use direct URL
    return file.path;
  } else {
    // Raw files need signed URLs
    // Extract public_id from the path (URL) that Cloudinary returned
    const publicId = extractPublicIdFromUrl(file.path);
    
    if (!publicId) {
      console.error('Could not extract public_id from URL:', file.path);
      // Fallback to original URL
      return file.path;
    }
    
    return generateSignedUrl(publicId, 'raw');
  }
}

module.exports = {
  generateSignedUrl,
  getPublicUrl,
  extractPublicIdFromUrl
};
