/**
 * Utility functions for generating QR codes
 */

/**
 * Generate a QR code URL for an entry pass
 * Uses a free QR code API service to generate the QR code image
 * @param {string} entryPassId - The entry pass ID to encode
 * @param {string} clientUrl - The client URL base (optional)
 * @returns {string} - URL to the QR code image
 */
function generateEntryPassQRCodeUrl(entryPassId, clientUrl = null) {
  // Create the data to encode in the QR code
  // If clientUrl is provided, create a URL that can be used to verify the pass
  // Otherwise, just encode the entry pass ID
  const qrData = clientUrl 
    ? `${clientUrl}/entry-passes/${entryPassId}` 
    : entryPassId.toString();
  
  // Use a free QR code API service (qr-server.com)
  // Alternative: You can use qrcode.tec-it.com or api.qrserver.com
  const encodedData = encodeURIComponent(qrData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}`;
  
  return qrCodeUrl;
}

/**
 * Generate a QR code data URL (base64 encoded image)
 * This requires a QR code library, but for now we'll use the API approach
 * @param {string} entryPassId - The entry pass ID to encode
 * @param {string} clientUrl - The client URL base (optional)
 * @returns {string} - Data URL for the QR code image
 */
async function generateEntryPassQRCodeDataUrl(entryPassId, clientUrl = null) {
  // For now, we'll use the URL approach
  // If you want to use a library like 'qrcode', you can install it and use:
  // const QRCode = require('qrcode');
  // return await QRCode.toDataURL(qrData);
  
  return generateEntryPassQRCodeUrl(entryPassId, clientUrl);
}

module.exports = {
  generateEntryPassQRCodeUrl,
  generateEntryPassQRCodeDataUrl,
};

