import { logEvent } from '../lib/ga';

export const downloadCanvasToImage = (designState) => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;

  const dataURL = canvas.toDataURL();
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'canvas.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Nếu truyền trạng thái hiện tại, log GA cho lần export này
  if (designState) {
    trackExportDesign(designState);
  }
};

export const reader = (file) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = reject;
    fileReader.readAsDataURL(file);
  });

export const getContrastingColor = (color) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 'black' : 'white';
};

/**
 * Gọi hàm này để ghi nhận hành vi export.
 * designState: { isFullTexture, isFrontLogoTexture, isBackLogoTexture, isFrontText, isBackText }
 */
export const trackExportDesign = (s = {}) => {
  try {
    logEvent('export_design', {
      format: 'png',
      with_texture: s.isFullTexture ? 1 : 0,
      with_front_logo: s.isFrontLogoTexture ? 1 : 0,
      with_back_logo: s.isBackLogoTexture ? 1 : 0,
      with_front_text: s.isFrontText ? 1 : 0,
      with_back_text: s.isBackText ? 1 : 0,
    });
  } catch {
    /* analytics optional – ignore */
  }
};
