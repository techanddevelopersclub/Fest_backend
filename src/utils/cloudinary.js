const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an image to Cloudinary and returns the URL
 * @param {string} filePath - Local path to the image file
 * @returns {Promise<string>} - URL of the uploaded image
 */
async function uploadImage(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'cieszyc/payments',
    resource_type: 'image',
  });
  return result.secure_url;
}

module.exports = { uploadImage };
