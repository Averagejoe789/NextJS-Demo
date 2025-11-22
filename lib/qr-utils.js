// QR code utility functions
import QRCode from 'qrcode';

/**
 * Generate QR code data URL for a table
 */
export async function generateQRCodeDataURL(restaurantId, tableId, baseUrl = '') {
  const url = `${baseUrl}/order?restaurantId=${restaurantId}&tableId=${tableId}`;
  
  try {
    const qrDataURL = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      dataURL: qrDataURL,
      url: url,
      restaurantId,
      tableId
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code buffer (for server-side storage)
 */
export async function generateQRCodeBuffer(restaurantId, tableId, baseUrl = '') {
  const url = `${baseUrl}/order?restaurantId=${restaurantId}&tableId=${tableId}`;
  
  try {
    const buffer = await QRCode.toBuffer(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return {
      buffer,
      url,
      restaurantId,
      tableId
    };
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Generate QR code SVG string
 */
export async function generateQRCodeSVG(restaurantId, tableId, baseUrl = '') {
  const url = `${baseUrl}/order?restaurantId=${restaurantId}&tableId=${tableId}`;
  
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      width: 400,
      margin: 2
    });
    
    return {
      svg,
      url,
      restaurantId,
      tableId
    };
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

