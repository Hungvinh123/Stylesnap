// src/lib/saveDesign.js
import state from '../store';

const API = import.meta.env.VITE_API_BASE || '';

async function uploadViaSupabaseBackend(file) {
  const fd = new FormData();
  fd.append('file', file, file.name || 'image.jpg');
  const r = await fetch(`${API}/api/uploads/sb`, {
    method: 'POST',
    body: fd,
    credentials: 'include',
  });
  if (!r.ok) {
    const t = await r.text().catch(()=>'');
    throw new Error(`SB_UPLOAD_FAILED: ${t.slice(0,200)}`);
  }
  const j = await r.json();
  return j.publicUrl || j.signedUrl;
}

async function blobToFile(blob, filename='image.jpg') {
  const type = blob?.type || 'image/jpeg';
  return new File([blob], filename, { type });
}

/** Lưu thiết kế hiện tại.
 *  - Sử dụng window.appCapture.{front,back} nếu có.
 *  - Upload preview + toàn bộ ảnh KH đã up.
 *  - Gọi /api/designs/save-min-urls để lưu DB.
 */
export async function saveCurrentDesign() {
  // 1) Capture trong Canvas
  if (!window.appCapture?.front) throw new Error('CAPTURE_NOT_READY');

  const frontBlob = await window.appCapture.front();
  const backBlob  = await window.appCapture.back();

  if (!frontBlob && !backBlob) throw new Error('NO_PREVIEW');

  // 2) Upload preview
  let frontUrl = null, backUrl = null;
  if (frontBlob) frontUrl = await uploadViaSupabaseBackend(await blobToFile(frontBlob, 'front.jpg'));
  if (backBlob)  backUrl  = await uploadViaSupabaseBackend(await blobToFile(backBlob,  'back.jpg'));

  // 3) Upload toàn bộ ảnh KH đã up (nếu có)
  const assets = [];
  const uploads = Array.isArray(state.uploadedAssets) ? state.uploadedAssets : [];
  for (let i = 0; i < uploads.length; i++) {
    const a = uploads[i];
    const filename = a?.filename || `asset-${i}.jpg`;

    if (a?.file) {
      const url = await uploadViaSupabaseBackend(a.file);
      assets.push({ kind: a?.kind || 'misc', filename, url });
    } else if (a?.dataUrl?.startsWith('data:')) {
      const res = await fetch(a.dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      const url = await uploadViaSupabaseBackend(file);
      assets.push({ kind: a?.kind || 'misc', filename, url });
    } else if (a?.url) {
      assets.push({ kind: a?.kind || 'misc', filename, url: a.url });
    }
  }

  // 4) Lưu vào DB (chỉ gửi URL)
  const res = await fetch(`${API}/api/designs/save-min-urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      title: 'Thiết kế của tôi',
      colorHex: state.color || '#FFFFFF',
      frontUrl, backUrl, assets,
    }),
  });
  const data = await res.json().catch(()=>null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'SAVE_MIN_URLS_FAILED');

  // 5) Lưu lại cho bước /checkout
  state.lastSavedDesign = {
    designId: data.designId,
    previewFrontUrl: data.previewFrontUrl || frontUrl,
    previewBackUrl:  data.previewBackUrl  || backUrl,
    assets,
  };
  state.canCheckout = true;

  return data; // { ok, designId, previewFrontUrl, previewBackUrl }
}
