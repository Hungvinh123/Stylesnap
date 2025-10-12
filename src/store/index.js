// src/store/index.js
import { proxy } from 'valtio';

const state = proxy({
  intro: true,

  // màu áo - three.js chỉ nhận #rrggbb
  color: '#ffffff',

  // layer toggles
  isFrontLogoTexture: true,
  isBackLogoTexture: true,
  isFrontText: true,
  isBackText: true,
  isFullTexture: false,

  // decals & vị trí/scale
  frontLogoDecal: './threejs.png',
  fullDecal: './texture.jpeg',
  frontLogoPosition: [0, 0.04, 0.15],
  frontLogoScale: 0.15,

  backLogoDecal: './threejs.png',
  backLogoPosition: [0, 0.04, -0.15],
  backLogoRotation: [0, Math.PI, 0],
  backLogoScale: 0.15,

  // text mặt trước
  frontText: 'Front Text',
  frontTextPosition: [0, -0.04, 0.15],
  frontTextRotation: [0, 0, 0],
  frontTextFontSize: 0.1,
  frontTextScale: [0.15, 0.04, 0.1],
  frontTextFont: 'Arial',
  frontTextSize: 64,
  frontTextColor: 'black',

  // text mặt sau
  backText: 'Back Text',
  backTextPosition: [0, -0.04, -0.15],
  backTextRotation: [0, Math.PI, 0],
  backTextFontSize: 0.1,
  backTextScale: [0.15, 0.04, 0.1],
  backTextFont: 'Arial',
  backTextSize: 64,
  backTextColor: 'white',

  // ảnh người dùng upload trong phiên
  uploadedAssets: [],

  // phục vụ capture/chụp ảnh
  modelRotationY: 0,

  // Sau khi bấm “Lưu thiết kế”: chỉ lưu URL ảnh để gửi mail – KHÔNG dùng để khoá nút thanh toán
  lastSavedDesign: null, // { previewFrontUrl, previewBackUrl, assets: [{kind, filename, url}] }

  // Giữ lại cho tương thích cũ nhưng không dùng để khoá UI nữa
  canCheckout: true,
});

export default state;
