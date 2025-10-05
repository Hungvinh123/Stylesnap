// src/components/FilePicker.jsx
import React from 'react';
import CustomButton from './CustomButton';
import { logEvent } from '../lib/ga';

const FilePicker = ({ file, setFile, readFile }) => {
  const handleApply = (variant) => {
    if (!file) return; // chưa chọn file thì thôi
    // Log GA gọn: theo variant
    try {
      const ext = file?.name?.split('.').pop()?.toLowerCase() || '';
      logEvent('upload_logo', {
        slot: variant === 'frontLogo' ? 'front' : 'full', // bạn có thể đổi thành 'back' nếu có nút/variant riêng
        file_ext: ext,
        file_size_kb: file?.size ? Math.round(file.size / 1024) : undefined,
      });
    } catch {
      /* analytics optional */
    }
    // Áp vào canvas/state
    readFile(variant);
  };

  return (
    <div className="filepicker-container">
      <div className="flex-1 flex flex-col">
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label htmlFor="file-upload" className="filepicker-label">
          Upload File
        </label>

        <p className="mt-2 text-gray-500 text-xs truncate">
          {!file ? 'No file selected' : file.name}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {/* Nếu dự án bạn dùng DecalTypes = { frontLogo, full }, giữ nguyên như dưới */}
        <CustomButton
          type="outline"
          title="Logo"
          handleClick={() => handleApply('frontLogo')}
          customStyles="text-xs"
        />
        <CustomButton
          type="filled"
          title="Full"
          handleClick={() => handleApply('full')}
          customStyles="text-xs"
        />
      </div>
    </div>
  );
};

export default FilePicker;
