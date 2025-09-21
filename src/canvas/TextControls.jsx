// src/components/TextControls.jsx
import React from 'react';
import { useSnapshot } from 'valtio';
import { SketchPicker } from 'react-color';
import state from '../store';
import { logEvent } from '../lib/ga';

const fonts = [
  "Arial","Times New Roman","Segoe UI","Tahoma","Calibri","Frutiger","Helvetica","Futura PT","Myriad Pro","Open Sans","Roboto","Verdana",
  "Adobe Arabic","Droid Arabic Naskh","GE SS Unique Light","Simplon Norm Arabic","Neue Helvetica Arabic","Noto Naskh Arabic","Ubuntu Arabic","Waseem","Zuhair","Dubai","Amiri","Bukra","Bahij Nazanin","Kufam","Lalezar","Mirza","Sakkal Majalla","Scheherazade","Tajawal","Lateef","Reem Kufi","Almarai","Cairo","Harmattan","Janna LT","Mada","Muna","JF Flat","JF Hitham","JF Nizar","JF Deco","JF Ziba","JF Unicode Naskh","JF Typist","JF Flat Arabic","JF Nizar Serif","JF Zaytoon","JF Zuhair","JF Deco Arabic","JF Hujjat","JF Noon","JF Raya","JF Riqa","JF Tulisan","JF Adeeb","JF Zarkan","JF Besmellah","JF Noori Nastaleeq","JF Noori Nastaleeq Kasheeda","JF Noori Nastaleeq V1.0","JF Noori Nastaleeq V2.0","JF Noori Nastaleeq V3.0","JF Noori Nastaleeq V4.0","JF Noori Nastaleeq V5.0","JF Noori Nastaleeq V6.0","JF Noori Nastaleeq V7.0","JF Noori Nastaleeq V8.0","JF Noori Nastaleeq V9.0","JF Noori Nastaleeq V10.0","JF Noori Nastaleeq V11.0","JF Noori Nastaleeq V12.0","JF Noori Nastaleeq V13.0","JF Noori Nastaleeq V14.0"
];

const TextControls = () => {
  const snap = useSnapshot(state);

  const handleTextChange = (type, value) => {
    const next = value ?? '';
    if (type === 'front') {
      const wasEmpty = !snap.frontText || snap.frontText.length === 0;
      state.frontText = next;
      // Log GA khi người dùng lần đầu nhập text (từ rỗng -> có nội dung)
      if (wasEmpty && next.trim().length > 0) {
        try {
          logEvent('add_text', {
            side: 'front',
            length: next.length,
            font: snap.frontTextFont || undefined,
          });
        } catch {}
      }
    } else if (type === 'back') {
      const wasEmpty = !snap.backText || snap.backText.length === 0;
      state.backText = next;
      if (wasEmpty && next.trim().length > 0) {
        try {
          logEvent('add_text', {
            side: 'back',
            length: next.length,
            font: snap.backTextFont || undefined,
          });
        } catch {}
      }
    }
  };

  const handlePositionChange = (type, index, value) => {
    const v = Number(value);
    if (type === 'front') {
      state.frontTextPosition[index] = v;
    } else if (type === 'back') {
      state.backTextPosition[index] = v;
    }
  };

  const handleRotationChange = (type, index, value) => {
    const v = Number(value);
    if (type === 'front') {
      state.frontTextRotation[index] = v;
    } else if (type === 'back') {
      state.backTextRotation[index] = v;
    }
  };

  const handleScaleChange = (type, index, value) => {
    const v = Number(value);
    if (type === 'front') {
      state.frontTextScale[index] = v;
    } else if (type === 'back') {
      state.backTextScale[index] = v;
    }
  };

  const handleFontChange = (type, value) => {
    if (type === 'front') {
      state.frontTextFont = value;
    } else if (type === 'back') {
      state.backTextFont = value;
    }
  };

  const handleColorChange = (type, value) => {
    if (type === 'front') {
      state.frontTextColor = value;
    } else if (type === 'back') {
      state.backTextColor = value;
    }
  };

  return (
    <div className="absolute left-full ml-3 flex flex-wrap space-y-2 overflow-y-scroll w-40 h-80">
      {/* Front text */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FT:</span>
        <input
          type="text"
          value={snap.frontText ?? ''}
          onChange={(e) => handleTextChange('front', e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FX:</span>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('front', 0, (snap.frontTextPosition?.[0] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('front', 0, (snap.frontTextPosition?.[0] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FY:</span>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('front', 1, (snap.frontTextPosition?.[1] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('front', 1, (snap.frontTextPosition?.[1] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FZ:</span>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('front', 2, (snap.frontTextPosition?.[2] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('front', 2, (snap.frontTextPosition?.[2] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FRX:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('front', 0, (snap.frontTextRotation?.[0] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('front', 0, (snap.frontTextRotation?.[0] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FRY:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('front', 1, (snap.frontTextRotation?.[1] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('front', 1, (snap.frontTextRotation?.[1] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FRZ:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('front', 2, (snap.frontTextRotation?.[2] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('front', 2, (snap.frontTextRotation?.[2] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FSX:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('front', 0, (snap.frontTextScale?.[0] ?? 1) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('front', 0, (snap.frontTextScale?.[0] ?? 1) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FSY:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('front', 1, (snap.frontTextScale?.[1] ?? 1) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('front', 1, (snap.frontTextScale?.[1] ?? 1) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FSZ:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('front', 2, (snap.frontTextScale?.[2] ?? 1) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('front', 2, (snap.frontTextScale?.[2] ?? 1) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FF:</span>
        <select
          value={snap.frontTextFont || fonts[0]}
          onChange={(e) => handleFontChange('front', e.target.value)}
          className="border rounded px-2 py-1"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">FC:</span>
        <SketchPicker
          color={snap.frontTextColor || '#000000'}
          disableAlpha
          onChange={(c) => handleColorChange('front', c.hex)}
        />
      </div>

      {/* Back text */}
      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BT:</span>
        <input
          type="text"
          value={snap.backText ?? ''}
          onChange={(e) => handleTextChange('back', e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BX:</span>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('back', 0, (snap.backTextPosition?.[0] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('back', 0, (snap.backTextPosition?.[0] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BY:</span>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('back', 1, (snap.backTextPosition?.[1] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('back', 1, (snap.backTextPosition?.[1] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BZ:</span>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('back', 2, (snap.backTextPosition?.[2] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handlePositionChange('back', 2, (snap.backTextPosition?.[2] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BRX:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('back', 0, (snap.backTextRotation?.[0] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('back', 0, (snap.backTextRotation?.[0] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BRY:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('back', 1, (snap.backTextRotation?.[1] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('back', 1, (snap.backTextRotation?.[1] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BRZ:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('back', 2, (snap.backTextRotation?.[2] ?? 0) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleRotationChange('back', 2, (snap.backTextRotation?.[2] ?? 0) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BSX:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('back', 0, (snap.backTextScale?.[0] ?? 1) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('back', 0, (snap.backTextScale?.[0] ?? 1) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BSY:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('back', 1, (snap.backTextScale?.[1] ?? 1) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('back', 1, (snap.backTextScale?.[1] ?? 1) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BSZ:</span>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('back', 2, (snap.backTextScale?.[2] ?? 1) - 0.01)}>
          -
        </button>
        <button className="border rounded-md p-2"
          onClick={() => handleScaleChange('back', 2, (snap.backTextScale?.[2] ?? 1) + 0.01)}>
          +
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BF:</span>
        <select
          value={snap.backTextFont || fonts[0]}
          onChange={(e) => handleFontChange('back', e.target.value)}
          className="border rounded px-2 py-1"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-gray-700">BC:</span>
        <SketchPicker
          color={snap.backTextColor || '#000000'}
          disableAlpha
          onChange={(c) => handleColorChange('back', c.hex)}
        />
      </div>
    </div>
  );
};

export default TextControls;
