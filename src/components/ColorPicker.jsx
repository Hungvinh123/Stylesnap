// src/components/ColorPicker.jsx
import React from 'react';
import { SketchPicker } from 'react-color';
import { useSnapshot } from 'valtio';

import state from '../store';
import { logEvent } from '../lib/ga';

const ColorPicker = () => {
  const snap = useSnapshot(state);

  return (
    <div className="absolute left-full ml-3">
      <SketchPicker
        color={snap.color}
        disableAlpha
        // cập nhật màu theo thời gian thực
        onChange={(c) => { state.color = c.hex; }}
        // chỉ log GA khi người dùng "thả" chuột (chọn xong)
        onChangeComplete={(c) => {
          try {
            logEvent('change_color', { hex: c.hex });
          } catch {
            /* analytics optional */
          }
        }}
      />
    </div>
  );
};

export default ColorPicker;
