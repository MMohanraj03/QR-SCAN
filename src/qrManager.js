import QRCode from 'qrcode';

/**
 * Render a styled QR Code onto an HTML5 canvas element
 */
export async function renderQRToCanvas(canvas, url, options = {}) {
  if (!canvas || !url) return;

  const {
    color = '#6366f1',
    bgColor = '#ffffff',
    margin = 2,
    width = 280,
    errorCorrectionLevel = 'M'
  } = options;

  try {
    await QRCode.toCanvas(canvas, url, {
      width,
      margin,
      color: {
        dark: color,
        light: bgColor
      },
      errorCorrectionLevel
    });
  } catch (err) {
    console.error('QR Canvas generation error:', err);
  }
}

/**
 * Generate a High-Resolution PNG Data URL (1024x1024) for download
 */
export async function generateHighResPNG(url, options = {}) {
  const {
    color = '#6366f1',
    bgColor = '#ffffff',
    width = 1024,
    margin = 3
  } = options;

  return await QRCode.toDataURL(url, {
    width,
    margin,
    color: {
      dark: color,
      light: bgColor
    },
    errorCorrectionLevel: 'H'
  });
}

/**
 * Generate an SVG string representation of the QR code
 */
export async function generateQRCodeSVG(url, options = {}) {
  const {
    color = '#6366f1',
    bgColor = '#ffffff',
    width = 512,
    margin = 2
  } = options;

  return await QRCode.toString(url, {
    type: 'svg',
    width,
    margin,
    color: {
      dark: color,
      light: bgColor
    },
    errorCorrectionLevel: 'H'
  });
}

/**
 * Trigger download of high-res QR code PNG file
 */
export async function downloadQRCodePNG(url, candidateName = 'resume', options = {}) {
  const dataUrl = await generateHighResPNG(url, options);
  const cleanName = candidateName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${cleanName}_resume_qr.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Draw candidate details and scannable QR on the Badge Canvas
 */
export async function renderBadgeCardQR(canvas, url, candidate) {
  if (!canvas) return;
  await renderQRToCanvas(canvas, url, {
    color: '#0f172a',
    bgColor: '#ffffff',
    width: 140,
    margin: 1
  });
}
