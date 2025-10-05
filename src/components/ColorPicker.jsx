import React, { useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import state from '../store';
import { FABRIC_COLORS } from '../config/fabric-colors';

// Nút + popover chứa 20 swatch
export default function ColorSwatchTab({ side = 'right' }) {
  const snap = useSnapshot(state);
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);
  const btnRef = useRef(null);

  // Đóng khi click ra ngoài / Esc
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (popRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const setColor = (hex) => { state.color = hex; setOpen(false); };

  // Vị trí popover tương đối với nút (trái hoặc phải)
  const placement = side === 'left'
    ? 'right-full mr-3 top-1/2 -translate-y-1/2'
    : 'left-full ml-3 top-1/2 -translate-y-1/2';

  return (
    <div className="relative inline-flex">
      {/* Nút chọn màu (icon bảng màu) */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Chọn màu vải"
        className="h-11 w-11 rounded-xl bg-white shadow ring-1 ring-black/5 grid place-items-center hover:shadow-md"
      >
        {/* icon đơn giản, có thể thay bằng ảnh của bạn */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700">
          <path d="M12 3a9 9 0 0 0-9 9c0 3.866 3.134 7 7 7h3.5a2.5 2.5 0 0 0 0-5H13a1 1 0 1 1 0-2h1a4 4 0 1 0 0-8h-2Zm-4 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-5 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Bảng màu vải"
          className={`absolute z-50 ${placement} w-60 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5`}
        >
          {/* swatches: 5 hàng x 4 cột */}
          <div className="grid grid-cols-4 gap-2">
            {FABRIC_COLORS.map((c) => {
              const active = (snap.color || '').toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.key}
                  onClick={() => setColor(c.hex)}
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

          {/* Tên màu đang chọn */}
          <div className="mt-3 text-xs text-gray-600 truncate">
            Màu: {
              FABRIC_COLORS.find(x => x.hex.toLowerCase() === (snap.color || '').toLowerCase())?.label
              || '—'
            }
          </div>
        </div>
      )}
    </div>
  );
}
