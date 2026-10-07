/**
 * Cloudinary Configuration & Uploader
 * 
 * WHY CLOUDINARY:
 * Disaster zones produce emergency photos (damage documentation, patient condition, rescue locations).
 * Storing heavy binary images directly in MongoDB degrades database performance and index caches.
 * Cloudinary provides cloud-based image hosting, optimization, responsive thumbnails, and secure CDN URLs.
 * 
 * DEMO FALLBACK:
 * If the user has not configured real Cloudinary credentials yet (placeholders present),
 * the uploader cleanly falls back to a simulated CDN image URL so emergency requests can still be submitted smoothly.
 */

const cloudinary = require('cloudinary').v2;

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'placeholder_cloud_name';
const apiKey = process.env.CLOUDINARY_API_KEY || 'placeholder_api_key';
const apiSecret = process.env.CLOUDINARY_API_SECRET || 'placeholder_api_secret';

const isConfigured =
  cloudName &&
  apiKey &&
  apiSecret &&
  !cloudName.includes('placeholder') &&
  !apiKey.includes('placeholder');

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Uploads a buffer or file path to Cloudinary.
 * Falls back to mock image if credentials are placeholder.
 */
const uploadImage = async (fileBuffer, originalFilename = 'emergency.jpg') => {
  if (!fileBuffer) {
    return '';
  }

  if (!isConfigured) {
    // Development fallback image representing emergency assistance
    console.log('[Cloudinary] Placeholder credentials detected. Using fallback disaster relief photo URL.');
    return 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80';
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'relief_shield_emergencies',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error.message);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  isConfigured,
  uploadImage,
};
