// src/pages/Customizer.jsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';
import { useNavigate } from 'react-router-dom';
import PolicyNudge from '../components/PolicyNudge';

import Stage from '../components/Stage';
import LogoControls from '../canvas/LogoControls';
import TextControls from '../canvas/TextControls';

import state from '../store';
import { downloadCanvasToImage, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes, texturesLogos } from '../config/constants';
import { fadeAnimation, slideAnimation } from '../config/motion';
import { CustomButton, FilePicker, TextureLogoPicker, Tab } from '../components';

/** ====== 20 màu theo bảng vải thun 100% cotton ====== */
const FABRIC_COLORS = [
  { key: 'xanh_ket_lt53', label: 'Xanh két LT53', hex: '#2E7D32' },
  { key: 'xanh_den',      label: 'Xanh đen',     hex: '#0B1D39' },
  { key: 'nau',           label: 'Nâu',          hex: '#8B4513' },
  { key: 'den',           label: 'Đen',          hex: '#000000' },
  { key: 'xanh_la',       label: 'Xanh lá',      hex: '#79C14D' },
  { key: 'xanh_bich',     label: 'Xanh bích',    hex: '#233586' },
  { key: 'do_do',         label: 'Đỏ đô',        hex: '#8B0000' },
  { key: 'tim_hue',       label: 'Tím Huế',      hex: '#2D133F' },
  { key: 'xanh_com',      label: 'Xanh cốm',     hex: '#B9D55F' },
  { key: 'xanh_ya',       label: 'Xanh ya',      hex: '#4880C3' },
  { key: 'do',            label: 'Đỏ',           hex: '#9A2B22' },
  { key: 'hong_sen',      label: 'Hồng sen',     hex: '#D55F82' },
  { key: 'vang',          label: 'Vàng',         hex: '#F2D22F' },
  { key: 'thien_thanh',   label: 'Thiên thanh',  hex: '#9AD9E0' },
  { key: 'cam_ngoi',      label: 'Cam ngói',     hex: '#F15F44' },
  { key: 'hong_phan',     label: 'Hồng phấn',    hex: '#EAA5C1' },
  { key: 'xam',           label: 'Xám',          hex: '#BDBDBA' },
  { key: 'bien',          label: 'Biển',         hex: '#75ACCC' },
  { key: 'cam',           label: 'Cam',          hex: '#E7A36F' },
  { key: 'trang',         label: 'Trắng',        hex: '#FFFFFF' },
];

/* ================= Helpers: xử lý ảnh KH upload (data:, blob:, http(s)) ================= */
const API_BASE = import.meta.env.VITE_API_BASE || '';

const isDataUrl = (u='') => /^data:/i.test(u);
const isHttpUrl = (u='') => /^https?:\/\//i.test(u);
const isBlobUrl = (u='') => /^blob:/i.test(u);
const baseName  = (u='asset.jpg') => {
  try {
    const p = new URL(u, window.location.origin);
    const name = decodeURIComponent(p.pathname.split('/').pop() || 'asset.jpg');
    return name || 'asset.jpg';
  } catch { return 'asset.jpg'; }
};
// Route URL ngoài qua proxy backend để có CORS header
const prox = (u='') => {
  if (!u) return u;
  if (isDataUrl(u) || isBlobUrl(u)) return u;
  if (isHttpUrl(u)) return `/api/img?url=${encodeURIComponent(u)}`;
  return u; // local/static
};

async function dataUrlToFile(dataUrl, filename='asset.jpg') {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
async function urlToFile(url, filename='asset.jpg') {
  const res = await fetch(isHttpUrl(url) ? prox(url) : url);
  if (!res.ok) throw new Error('FETCH_REMOTE_ASSET_FAILED');
  const blob = await res.blob();
  const ct = res.headers.get('content-type') || blob.type || 'image/jpeg';
  const ext = ct.includes('png') ? '.png' : ct.includes('webp') ? '.webp' : ct.includes('jpeg') ? '.jpg' : '';
  const finalName = filename.endsWith(ext) || !ext ? filename : filename + ext;
  return new File([blob], finalName, { type: ct });
}

// Chuẩn hoá mọi kiểu input thành File (File | Blob | data: | blob: | http(s))
const toFile = async (any, nameHint = `image-${Date.now()}.jpg`) => {
  if (any && typeof any === 'object' && 'name' in any && any instanceof File) return any;
  if (any instanceof Blob) return new File([any], nameHint, { type: any.type || 'application/octet-stream' });
  if (typeof any === 'string' && isDataUrl(any)) return await dataUrlToFile(any, nameHint);
  if (typeof any === 'string' && (isBlobUrl(any) || isHttpUrl(any)))
    return await urlToFile(any, baseName(any) || nameHint);
  throw new Error('UNSUPPORTED_FILE_INPUT');
};
/* ======================================================================== */

/** Popover mini chứa swatch màu. */
function ColorSwatchPopover({ currentHex, onSelect, side = 'right' }) {
  const placement = side === 'left'
    ? 'right-full mr-3 top-1/2 -translate-y-1/2'
    : 'left-full ml-3 top-1/2 -translate-y-1/2';

  const activeLabel =
    FABRIC_COLORS.find(x => x.hex.toLowerCase() === (currentHex || '').toLowerCase())?.label || '—';

  return (
    <div role="dialog" aria-label="Bảng màu vải"
      className={`absolute z-50 ${placement} w-52 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5`}>
      <div className="grid grid-cols-4 gap-2">
        {FABRIC_COLORS.map((c) => {
          const active = (currentHex || '').toLowerCase() === c.hex.toLowerCase();
          return (
            <button key={c.key} onClick={() => onSelect(c.hex)} aria-label={c.label} title={c.label}
              className={['h-9 w-9 rounded-md ring-2 transition', active ? 'ring-black scale-[1.04]' : 'ring-transparent hover:ring-black/40'].join(' ')}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
      <div className="mt-3 text-xs text-gray-600 truncate">Màu: {activeLabel}</div>
    </div>
  );
}

/** Banner mini */
function Notice({ kind='pending', title, message }) {
  const color =
    kind === 'success' ? 'bg-green-50 text-green-700 ring-green-600/20' :
    kind === 'error'   ? 'bg-red-50 text-red-700 ring-red-600/20' :
                         'bg-amber-50 text-amber-800 ring-amber-600/20';
  const icon = kind === 'success' ? '✔' : kind === 'error' ? '✖' : '…';
  return (
    <div className={['w-[300px] rounded-xl ring-1 px-3 py-2 shadow-sm', 'backdrop-blur-sm', color].join(' ')}>
      <div className="flex items-start gap-2">
        <div className="text-base leading-none">{icon}</div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {message ? <div className="text-xs mt-0.5 leading-snug break-words">{message}</div> : null}
        </div>
      </div>
    </div>
  );
}

const Customizer = () => {
  const snap = useSnapshot(state);
  const nav = useNavigate();

  const [file, setFile] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState('');

  // filter tabs
  const [activeFilterTab, setActiveFilterTab] = useState({
    frontLogoShirt: true,
    backLogoShirt: true,
    frontTextShirt: true,
    backTextShirt: true,
    stylishShirt: false,
  });

  // notice + history
  const [notice, setNotice] = useState({ visible:false, kind:'pending', title:'', message:'' });
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  useEffect(() => { state.intro = false; }, []);

  /* -------------------- UNDO / REDO -------------------- */
  const takeSnapshot = () => ({
    color: state.color,
    fullDecal: state.fullDecal || null,
    frontLogoDecal: state.frontLogoDecal || null,
    backLogoDecal: state.backLogoDecal || null,
    isFullTexture: !!state.isFullTexture,
    isFrontLogoTexture: !!state.isFrontLogoTexture,
    isBackLogoTexture: !!state.isBackLogoTexture,
    isFrontText: !!state.isFrontText,
    isBackText: !!state.isBackText,
  });

  const applySnapshot = (s) => {
    state.color = s.color;
    state.fullDecal = s.fullDecal;
    state.frontLogoDecal = s.frontLogoDecal;
    state.backLogoDecal = s.backLogoDecal;
    state.isFullTexture = s.isFullTexture;
    state.isFrontLogoTexture = s.isFrontLogoTexture;
    state.isBackLogoTexture = s.isBackLogoTexture;
    state.isFrontText = s.isFrontText;
    state.isBackText = s.isBackText;
    setActiveFilterTab({
      frontLogoShirt: s.isFrontLogoTexture,
      backLogoShirt: s.isBackLogoTexture,
      frontTextShirt: s.isFrontText,
      backTextShirt: s.isBackText,
      stylishShirt: s.isFullTexture,
    });
  };

  const pushHistory = () => {
    setHistory((h) => [...h.slice(-19), takeSnapshot()]);
    setRedoStack([]); // reset redo khi có action mới
  };

  const handleUndo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      const curr = takeSnapshot();
      setRedoStack((r) => [...r, curr]);
      applySnapshot(last);
      return h.slice(0, -1);
    });
  };

  const handleRedo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const nxt = r[r.length - 1];
      const curr = takeSnapshot();
      setHistory((h) => [...h, curr]);
      applySnapshot(nxt);
      return r.slice(0, -1);
    });
  };

  /* --------------------- Actions ---------------------- */
  const handleSelectFabricColor = (hex) => {
    pushHistory();
    state.color = hex;
  };

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case 'colorpicker':
        return <ColorSwatchPopover currentHex={snap.color} onSelect={handleSelectFabricColor} side="right" />;
      case 'filepicker': return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case 'logocontrols': return <LogoControls />;
      case 'textcontrols': return <TextControls />;
      case 'texturelogopicker':
        return <TextureLogoPicker texturesLogos={texturesLogos} handleTextureLogoClick={handleTextureLogoClick} />;
      default: return null;
    }
  };

  // Bật/Tắt texture/logo có sẵn (toggle on/off) — KHÔNG xoá URL để tránh loader lỗi
  const handleTextureLogoClick = (textureLogo) => {
    const { type, image } = textureLogo;

    if (type === 'texture') {
      pushHistory();
      const isSameActive = snap.isFullTexture && snap.fullDecal === image;
      if (isSameActive) {
        // tắt chỉ bằng flag
        state.isFullTexture = false;
        setActiveFilterTab((p) => ({ ...p, stylishShirt: false }));
      } else {
        state.fullDecal = image;
        state.isFullTexture = true;
        setActiveFilterTab((p) => ({ ...p, stylishShirt: true }));
      }
      return;
    }

    if (type === 'frontLogo') {
      pushHistory();
      const isSameActive = snap.isFrontLogoTexture && snap.frontLogoDecal === image;
      if (isSameActive) {
        state.isFrontLogoTexture = false;
        setActiveFilterTab((p) => ({ ...p, frontLogoShirt: false }));
      } else {
        state.frontLogoDecal = image;
        state.isFrontLogoTexture = true;
        setActiveFilterTab((p) => ({ ...p, frontLogoShirt: true }));
      }
      return;
    }

    if (type === 'backLogo') {
      pushHistory();
      const isSameActive = snap.isBackLogoTexture && snap.backLogoDecal === image;
      if (isSameActive) {
        state.isBackLogoTexture = false;
        setActiveFilterTab((p) => ({ ...p, backLogoShirt: false }));
      } else {
        state.backLogoDecal = image;
        state.isBackLogoTexture = true;
        setActiveFilterTab((p) => ({ ...p, backLogoShirt: true }));
      }
      return;
    }
  };

  const mapTypeToFilterTab = (type) => (type === 'frontLogo' ? 'frontLogoShirt' : type === 'backLogo' ? 'backLogoShirt' : 'stylishShirt');
  const ensureFilterOn = (filterName) => { if (!activeFilterTab[filterName]) handleActiveFilterTab(filterName); };

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type]; if (!decalType) return;
    pushHistory();
    state[decalType.stateProperty] = result;
    ensureFilterOn(mapTypeToFilterTab(type));
  };

  const handleActiveFilterTab = (tabName) => {
    pushHistory();
    switch (tabName) {
      case 'frontLogoShirt': state.isFrontLogoTexture = !activeFilterTab[tabName]; break;
      case 'backLogoShirt': state.isBackLogoTexture = !activeFilterTab[tabName]; break;
      case 'frontTextShirt': state.isFrontText = !activeFilterTab[tabName]; break;
      case 'backTextShirt': state.isBackText = !activeFilterTab[tabName]; break;
      case 'stylishShirt': state.isFullTexture = !activeFilterTab[tabName]; break;
      case 'downloadShirt': downloadCanvasToImage(); break;
      default: break;
    }
    setActiveFilterTab((prev) => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  /** Ghi lại file KH vừa chọn để sau này upload */
  const readFile = (type) => {
    if (!file) return;
    reader(file).then((result) => {
      handleDecals(type, result);
      try {
        const kindMap = { frontLogo: 'frontLogo', backLogo: 'backLogo', full: 'texture' };
        const kind = kindMap[type] || 'misc';
        state.uploadedAssets = [
          ...(state.uploadedAssets || []),
          { kind, filename: file?.name || `${kind}.jpg`, file, dataUrl: result }
        ];
      } catch (e) { console.warn('save uploaded asset failed', e); }
    });
  };

  // ================== SAVE DESIGN (Supabase qua backend) ==================
  async function uploadViaSupabaseBackend(input, nameHint = `image-${Date.now()}.jpg`) {
    const fileObj = await toFile(input, nameHint);           // luôn là File
    const fd = new FormData();                                // FormData chuẩn
    fd.append('file', fileObj, fileObj.name || nameHint);
    const res = await fetch(`${API_BASE}/api/uploads/sb`, { method:'POST', body: fd, credentials:'include' });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    if (!res.ok || !json) throw new Error(`SB_UPLOAD_FAILED ${res.status}: ${text.slice(0,200)}`);
    return json.publicUrl || json.signedUrl; // bucket public -> publicUrl
  }

  async function saveCurrentDesign() {
    setNotice({ visible:true, kind:'pending', title:'Đang lưu thiết kế…', message:'' });

    try {
      // 1) chụp canvas (Stage đang mount tại /customize)
      const frontBlob = await (window.appCapture?.front?.() || null);
      const backBlob  = await (window.appCapture?.back?.()  || null);
      if (!frontBlob && !backBlob) throw new Error('NO_PREVIEW');

      // 2) upload front/back
      let frontUrl = null, backUrl = null;
      if (frontBlob) frontUrl = await uploadViaSupabaseBackend(frontBlob, `${Date.now()}-front.jpg`);
      if (backBlob)  backUrl  = await uploadViaSupabaseBackend(backBlob,  `${Date.now()}-back.jpg`);

      // 3) upload ảnh KH đã up + FALLBACK quét decal (data:, blob:, http(s))
      const assets = [];
      const pushed = new Set();

      // 3.a) từ uploadedAssets
      const uploads = Array.isArray(state.uploadedAssets) ? state.uploadedAssets : [];
      for (let i = 0; i < uploads.length; i++) {
        const a = uploads[i];
        const filenameBase = a?.filename || `asset-${i}`;

        let candidate = a?.file ?? a?.dataUrl ?? a?.url ?? null;
        if (!candidate) continue;

        try {
          const url = await uploadViaSupabaseBackend(candidate, baseName(a?.filename || '') || (filenameBase + '.jpg'));
          if (!pushed.has(url)) { assets.push({ kind: a?.kind || 'misc', filename: baseName(url) || (filenameBase + '.jpg'), url }); pushed.add(url); }
        } catch (err) { console.warn('upload asset failed, continue:', err); }
      }

      // 3.b) FALLBACK từ các decal đang áp dụng
      const fallbacks = [
        { kind:'frontLogo', src: state.frontLogoDecal },
        { kind:'backLogo',  src: state.backLogoDecal },
        { kind:'texture',   src: state.fullDecal },
      ];
      for (const fb of fallbacks) {
        const src = fb.src;
        if (!src) continue;

        try {
          const url = await uploadViaSupabaseBackend(src, `${fb.kind}-${Date.now()}.jpg`);
          if (!pushed.has(url)) { assets.push({ kind: fb.kind, filename: baseName(url) || `${fb.kind}.jpg`, url }); pushed.add(url); }
        } catch (err) { console.warn('fallback upload failed:', err); }
      }

      state.lastSavedDesign = {
        designId: Date.now(), // placeholder, không lưu /designs nữa
        previewFrontUrl: frontUrl,
        previewBackUrl:  backUrl,
        assets
      };

      setNotice({ visible:true, kind:'success', title:'Đã upload ảnh lên kho', message:`Front/Back + ${assets.length} ảnh người dùng` });
      setTimeout(() => setNotice(s => ({...s, visible:false})), 3500);
    } catch (e) {
      console.error(e);
      setNotice({ visible:true, kind:'error', title:'Lưu thiết kế thất bại', message:'Kiểm tra lại ảnh/Canvas (CORS) và thử lại.' });
    }
  }

  return (
    <section className="page-wrap">
      <Stage />
      <PolicyNudge policyUrl="/policy/asset-guidelines" />

      {/* Góc trái trên: Undo/Redo + Notice */}
      <div className="fixed top-4 left-4 z-50 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ring-1 ${history.length ? 'bg-white ring-black/10 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'}`}
            title="Hoàn tác (Undo)"
          >↶ Undo</button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ring-1 ${redoStack.length ? 'bg-white ring-black/10 hover:bg-gray-50' : 'bg-gray-100 text-gray-400 ring-gray-200 cursor-not-allowed'}`}
            title="Làm lại (Redo)"
          >↷ Redo</button>
        </div>
        {notice.visible && <Notice kind={notice.kind} title={notice.title} message={notice.message} />}
      </div>

      <AnimatePresence>
        {/* THÊM key cho từng con để tránh cảnh báo trùng key */}
        <motion.div key="panel-left" className="panel-left" {...slideAnimation('left')}>
          <div className="editortabs-container tabs relative">
            {EditorTabs.map((tab) => (
              <Tab
                key={tab.name}
                tab={tab}
                handleClick={() => {
                  if (tab.name === 'colorpicker') {
                    setActiveEditorTab((prev) => (prev === 'colorpicker' ? '' : 'colorpicker'));
                  } else {
                    setActiveEditorTab(tab.name);
                  }
                }}
              />
            ))}
            {generateTabContent()}
          </div>
        </motion.div>

        <motion.div key="go-back" className="go-back ui-layer" {...fadeAnimation}>
          <CustomButton
            type="filled"
            title="Go Back"
            handleClick={() => nav('/home')}
            customStyles="w-fit px-4 py-2.5 font-bold text-sm"
          />
        </motion.div>

        <motion.div key="toolbar" className="filtertabs-container ui-layer" {...slideAnimation('up')}>
          {FilterTabs.map((tab) => (
            <Tab
              key={tab.name}
              tab={tab}
              isFilterTab
              isActiveTab={!!activeFilterTab[tab.name]}
              handleClick={() => handleActiveFilterTab(tab.name)}
            />
          ))}

          {/* Nút LƯU THIẾT KẾ (chỉ upload lên kho) */}
          <CustomButton
            type="filled"
            title="Lưu thiết kế"
            handleClick={saveCurrentDesign}
            customStyles="w-fit px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white"
          />

          {/* Nút THANH TOÁN: luôn bật */}
          <CustomButton
            type="filled"
            title="Thanh Toán"
            handleClick={() => nav('/checkout')}
            customStyles="w-fit px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white"
          />
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Customizer;
