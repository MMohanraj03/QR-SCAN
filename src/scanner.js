import { Html5Qrcode } from 'html5-qrcode';

let html5QrCode = null;
let isScanning = false;

/**
 * Play a high-tech positive audio chime using Web Audio API
 */
export function playSuccessChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } catch (e) {
    // AudioContext blocked or unsupported, silent fail
  }
}

/**
 * Initialize and start the live camera stream
 */
export async function startCameraScanner(elementId, onScanSuccess, onScanError) {
  if (isScanning) return;

  try {
    if (!html5QrCode) {
      html5QrCode = new Html5Qrcode(elementId);
    }

    const qrBoxSize = (viewfinderWidth, viewfinderHeight) => {
      const minEdgePercentage = 0.7;
      const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
      return {
        width: Math.min(qrboxSize, 250),
        height: Math.min(qrboxSize, 250)
      };
    };

    const config = {
      fps: 15,
      qrbox: qrBoxSize,
      aspectRatio: 1.0
    };

    await html5QrCode.start(
      { facingMode: 'environment' },
      config,
      (decodedText, decodedResult) => {
        playSuccessChime();
        onScanSuccess(decodedText, decodedResult);
      },
      (errorMessage) => {
        if (onScanError) onScanError(errorMessage);
      }
    );

    isScanning = true;
    return true;
  } catch (err) {
    console.error('Failed to start camera QR scanner:', err);
    throw err;
  }
}

/**
 * Stop camera scanner
 */
export async function stopCameraScanner() {
  if (html5QrCode && isScanning) {
    try {
      await html5QrCode.stop();
      isScanning = false;
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    }
  }
}

/**
 * Scan an uploaded image file (screenshot or photo of a QR code)
 */
export async function scanQRFromFile(file, onScanSuccess) {
  try {
    const scanner = new Html5Qrcode('qrReader');
    const decodedText = await scanner.scanFile(file, true);
    playSuccessChime();
    onScanSuccess(decodedText);
    return decodedText;
  } catch (err) {
    console.error('QR Image decoding error:', err);
    throw new Error('No QR code could be detected in this image. Please try a clearer picture.');
  }
}
