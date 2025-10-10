// src/pages/Customizer.jsx
import React, { useState, useEffect, useRef } from 'react';
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

/** ====== UNDO/REDO – Chỉ lưu phần state liên quan thiết kế ====== */
const DESIGN_KEYS = [
  'color',
  'isFullTexture', 'isFrontLogoTexture', 'isBackLogoTexture', 'isFrontText', 'isBackText',
  'fullDecal', 'frontLogoDecal', 'backLogoDecal',
  'frontText', 'backText',
  'frontTextColor', 'backTextColor',
  'frontTextFont', 'backTextFont',
  'frontTextPosition', 'backTextPosition',
  'frontTextRotation', 'backTextRotation',
  'frontTextScale', 'backTextScale',
];
const MAX_HISTORY = 50;

function pickDesignSnapshot(snap) {
  const o = {};
  for (const k of DESIGN_KEYS) {
    const v = snap?.[k];
    o[k] = Array.isArray(v) ? [...v] : (v ?? null);
  }
  return o;
}

/** Chữ ký nhẹ để so sánh thay đổi (tránh stringify base64 dài) */
function makeSignature(snap) {
  const s = {};
  for (const k of DESIGN_KEYS) {
    const v = snap?.[k];
    if (typeof v === 'string' && (k === 'fullDecal' || k === 'frontLogoDecal' || k === 'backLogoDecal')) {
      s[k] = v ? `len:${v.length}|head:${v.slice(0, 32)}` : '';
    } else if (Array.isArray(v)) {
      s[k] = [...v];
    } else {
      s[k] = v ?? null;
    }
  }
  return s;
}

function applyDesignSnapshot(s) {
  if (!s) return;
  for (const k of DESIGN_KEYS) {
    const v = s[k];
    state[k] = Array.isArray(v) ? [...v] : v;
  }
}

/** Popover mini chứa swatch màu. Không tự đóng; chỉ đóng khi click lại icon màu. */
function ColorSwatchPopover({ currentHex, onSelect, side = 'right' }) {
  const placement = side === 'left'
    ? 'right-full mr-3 top-1/2 -translate-y-1/2'
    : 'left-full ml-3 top-1/2 -translate-y-1/2';

  const activeLabel =
    FABRIC_COLORS.find(x => x.hex.toLowerCase() === (currentHex || '').toLowerCase())?.label || '—';

  return (
    <div
      role="dialog"
      aria-label="Bảng màu vải"
      className={`absolute z-50 ${placement} w-52 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5`}
    >
      <div className="grid grid-cols-4 gap-2">
        {FABRIC_COLORS.map((c) => {
          const active = (currentHex || '').toLowerCase() === c.hex.toLowerCase();
          return (
            <button
              key={c.key}
              onClick={() => onSelect(c.hex)}           // không đóng popover
              aria-label={c.label}
              title={c.label}
              className={[
                'h-9 w-9 rounded-md ring-2 transition',
                active ? 'ring-black scale-[1.04]' : 'ring-transparent hover:ring-black/40'
              ].join(' ')}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}
      </div>
      <div className="mt-3 text-xs text-gray-600 truncate">Màu: {activeLabel}</div>
    </div>
  );
}

const Customizer = () => {
  const snap = useSnapshot(state);
  const nav = useNavigate();

  const [file, setFile] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState({
    frontLogoShirt: true,
    backLogoShirt: true,
    frontTextShirt: true,
    backTextShirt: true,
    stylishShirt: false,
  });

  /** ====== UNDO/REDO state ====== */
  const [history, setHistory] = useState([]);     // mảng snapshot thiết kế
  const [pointer, setPointer] = useState(-1);     // vị trí hiện tại trong history
  const restoringRef = useRef(false);
  const lastSigRef = useRef('');                  // chữ ký nhẹ gần nhất

  // Khởi tạo history với snapshot ban đầu
  useEffect(() => {
    const init = pickDesignSnapshot(snap);
    setHistory([init]);
    setPointer(0);
    lastSigRef.current = JSON.stringify(makeSignature(snap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần

  // Ghi lịch sử mỗi khi thiết kế đổi (tự động, không chạm logic team)
  useEffect(() => {
    if (restoringRef.current) {
      restoringRef.current = false;
      lastSigRef.current = JSON.stringify(makeSignature(snap));
      return;
    }
    const sig = JSON.stringify(makeSignature(snap));
    if (sig === lastSigRef.current) return;

    const currFull = pickDesignSnapshot(snap);
    setHistory((prev) => {
      // cắt bỏ các bước "tương lai" nếu đã undo rồi lại chỉnh tiếp
      let next = prev.slice(0, pointer + 1);
      next.push(currFull);
      if (next.length > MAX_HISTORY) next = next.slice(next.length - MAX_HISTORY);
      return next;
    });
    setPointer((p) => {
      const nextLen = Math.min(pointer + 2, MAX_HISTORY);
      return nextLen - 1;
    });
    lastSigRef.current = sig;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pointer,
    // Các trường ảnh hưởng thiết kế
    snap.color,
    snap.isFullTexture, snap.isFrontLogoTexture, snap.isBackLogoTexture, snap.isFrontText, snap.isBackText,
    snap.fullDecal, snap.frontLogoDecal, snap.backLogoDecal,
    snap.frontText, snap.backText,
    snap.frontTextColor, snap.backTextColor,
    snap.frontTextFont, snap.backTextFont,
    JSON.stringify(snap.frontTextPosition || []),
    JSON.stringify(snap.backTextPosition || []),
    JSON.stringify(snap.frontTextRotation || []),
    JSON.stringify(snap.backTextRotation || []),
    JSON.stringify(snap.frontTextScale || []),
    JSON.stringify(snap.backTextScale || []),
  ]);

  const canUndo = pointer > 0;
  const canRedo = pointer >= 0 && pointer < history.length - 1;

  const doUndo = () => {
    if (!canUndo) return;
    const nextIndex = pointer - 1;
    restoringRef.current = true;
    applyDesignSnapshot(history[nextIndex]);
    setPointer(nextIndex);
  };
  const doRedo = () => {
    if (!canRedo) return;
    const nextIndex = pointer + 1;
    restoringRef.current = true;
    applyDesignSnapshot(history[nextIndex]);
    setPointer(nextIndex);
  };

  // Phím tắt: Ctrl/Cmd+Z / Ctrl+Shift+Z
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo(); else doUndo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pointer, history]); // cập nhật theo trạng thái mới nhất

  useEffect(() => { state.intro = false; }, []);

  /** ===== Helpers bật/tắt filter chính xác (không toggle mù) ===== */
  const setFilter = (filterName, enabled) => {
    switch (filterName) {
      case 'frontLogoShirt': state.isFrontLogoTexture = !!enabled; break;
      case 'backLogoShirt':  state.isBackLogoTexture  = !!enabled; break;
      case 'stylishShirt':   state.isFullTexture      = !!enabled; break;
      case 'frontTextShirt': state.isFrontText        = !!enabled; break;
      case 'backTextShirt':  state.isBackText         = !!enabled; break;
      default: break;
    }
    setActiveFilterTab((prev) => ({ ...prev, [filterName]: !!enabled }));
  };

  const mapTypeToFilterTab = (type) => {
    if (type === 'frontLogo') return 'frontLogoShirt';
    if (type === 'backLogo')  return 'backLogoShirt';
    return 'stylishShirt'; // 'full'
  };

  /** Toggle decal: click lại cùng ảnh => chỉ tắt filter, không clear chuỗi ảnh */
  const toggleDecal = (type, image) => {
    const decalType = DecalTypes[type];
    if (!decalType) return;

    const filterName = mapTypeToFilterTab(type);
    const isOn = !!activeFilterTab[filterName];
    const current = state[decalType.stateProperty];
    const isSameImage = !!image && !!current && image === current;

    if (isOn && isSameImage) {
      // Undo áp ảnh: tắt filter (để renderer không load null)
      setFilter(filterName, false);
      return;
    }

    if (!isOn) {
      // Bật lại filter; dùng ảnh mới nếu có, nếu không dùng ảnh đang lưu
      if (image) state[decalType.stateProperty] = image;
      setFilter(filterName, true);
      return;
    }

    // Đang bật và chọn ảnh khác -> thay ảnh
    if (image && image !== current) {
      state[decalType.stateProperty] = image;
    }
  };

  const handleSelectFabricColor = (hex) => {
    state.color = hex; // giữ popover mở
  };

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case 'colorpicker':
        return (
          <ColorSwatchPopover
            currentHex={snap.color}
            onSelect={handleSelectFabricColor}
            side="right"
          />
        );
      case 'filepicker':
        return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case 'logocontrols':
        return <LogoControls />;
      case 'textcontrols':
        return <TextControls />;
      case 'texturelogopicker':
        return (
          <TextureLogoPicker
            texturesLogos={texturesLogos}
            handleTextureLogoClick={handleTextureLogoClick}
          />
        );
      default:
        return null;
    }
  };

  /** Click item preset (TextureLogoPicker) -> toggle */
  const handleTextureLogoClick = (textureLogo) => {
    if (textureLogo.type === 'texture') {
      toggleDecal('full', textureLogo.image);
    } else if (textureLogo.type === 'frontLogo') {
      toggleDecal('frontLogo', textureLogo.image);
    } else if (textureLogo.type === 'backLogo') {
      toggleDecal('backLogo', textureLogo.image);
    }
  };

  /** Upload file -> toggle nếu up lại đúng ảnh đang áp */
  const readFile = (type) => {
    if (!file) return;
    reader(file).then((result) => {
      toggleDecal(type, result); // type: 'full' | 'frontLogo' | 'backLogo'
      // không đụng đến activeEditorTab
    });
  };

  /** API cũ vẫn hoạt động */
  const ensureFilterOn = (filterName) => {
    if (!activeFilterTab[filterName]) setFilter(filterName, true);
  };

  const handleDecals = (type, result) => {
    // giữ để tương thích nếu nơi khác gọi
    toggleDecal(type, result);
  };

  const handleActiveFilterTab = (tabName) => {
    // hành vi hiện tại của team khi bấm icon filter trực tiếp
    switch (tabName) {
      case 'frontLogoShirt': state.isFrontLogoTexture = !activeFilterTab[tabName]; break;
      case 'backLogoShirt':  state.isBackLogoTexture  = !activeFilterTab[tabName]; break;
      case 'frontTextShirt': state.isFrontText        = !activeFilterTab[tabName]; break;
      case 'backTextShirt':  state.isBackText         = !activeFilterTab[tabName]; break;
      case 'stylishShirt':   state.isFullTexture      = !activeFilterTab[tabName]; break;
      case 'downloadShirt':  downloadCanvasToImage(); break;
      default: break;
    }
    setActiveFilterTab((prev) => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  return (
    <section className="page-wrap">
      {/* Model 3D */}
      <Stage />

      {/* Nudge cảnh báo mềm */}
      <PolicyNudge policyUrl="/policy/asset-guidelines" />

      <AnimatePresence initial={false}>
        {/* —— Undo/Redo: góc trên bên trái (chừa panel trái) —— */}
        <motion.div
          key="undoRedoOverlay"
          className="fixed top-4 left-24 z-50 flex items-center gap-2"
          style={{ pointerEvents: 'none' }} // không chặn khu vực phía sau
          {...fadeAnimation}
        >
          <button
            onClick={doUndo}
            disabled={!canUndo}
            title="Hoàn tác (Ctrl/Cmd + Z)"
            className={[
              'px-3 py-2 rounded-lg ring-1 text-sm',
              canUndo
                ? 'bg-white ring-black/10 hover:bg-gray-50'
                : 'bg-gray-100 ring-black/5 text-gray-400 cursor-not-allowed'
            ].join(' ')}
            style={{ pointerEvents: 'auto' }}
          >
            ↶ Làm lại
          </button>
          <button
            onClick={doRedo}
            disabled={!canRedo}
            title="Làm lại (Ctrl/Cmd + Shift + Z)"
            className={[
              'px-3 py-2 rounded-lg ring-1 text-sm',
              canRedo
                ? 'bg-white ring-black/10 hover:bg-gray-50'
                : 'bg-gray-100 ring-black/5 text-gray-400 cursor-not-allowed'
            ].join(' ')}
            style={{ pointerEvents: 'auto' }}
          >
            ↷ Tiếp tục
          </button>
        </motion.div>

        {/* Panel trái: cần 'relative' để định vị popover */}
        <motion.div key="panelLeft" className="panel-left" {...slideAnimation('left')}>
          <div className="editortabs-container tabs relative">
            {EditorTabs.map((tab, idx) => (
              <Tab
                key={tab.name || `editor-${idx}`}
                tab={tab}
                handleClick={() => {
                  // Riêng tab màu: toggle mở/đóng khi bấm lại cùng nút
                  if (tab.name === 'colorpicker') {
                    setActiveEditorTab((prev) => (prev === 'colorpicker' ? '' : 'colorpicker'));
                  } else {
                    setActiveEditorTab(tab.name);
                  }
                }}
              />
            ))}
            {/* Popover màu + các editor nội dung khác */}
            {generateTabContent()}
          </div>
        </motion.div>

        {/* Go Back – góc phải trên */}
        <motion.div key="goBack" className="go-back ui-layer" {...fadeAnimation}>
          <CustomButton
            type="filled"
            title="Go Back"
            handleClick={() => nav('/home')}
            customStyles="w-fit px-4 py-2.5 font-bold text-sm"
          />
        </motion.div>

        {/* Nhóm icon vàng – giữa đáy màn hình */}
<motion.div
  key="filterTabs"
  className="filtertabs-container ui-layer pointer-events-auto"
  {...slideAnimation('up')}
>
  {FilterTabs.map((tab, idx) => (
    <Tab
      key={tab.name || `filter-${idx}`}
      tab={tab}
      isFilterTab
      isActiveTab={!!activeFilterTab[tab.name]}
      handleClick={() => handleActiveFilterTab(tab.name)}
    />
  ))}

  {/* Nút Thanh Toán: thu nhỏ + không chiếm cả dòng */}
  <div className="ml-auto shrink-0">
    <CustomButton
      type="filled"
      title="Thanh Toán"
      handleClick={() => nav('/checkout')}
      // nhỏ gọn, width theo nội dung, không giãn
      customStyles="!w-auto inline-flex items-center gap-2 px-5 py-3 text-xs font-semibold rounded-md bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-700/90"
    />
  </div>
</motion.div>

      </AnimatePresence>
    </section>
  );
};

export default Customizer;
