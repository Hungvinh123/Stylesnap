import React from 'react';
import { logEvent } from '../lib/ga';

const TextureLogoPicker = ({ texturesLogos = [], handleTextureLogoClick }) => {
  const textures   = texturesLogos.filter((it) => it.type === 'texture');
  const frontLogos = texturesLogos.filter((it) => it.type === 'frontLogo');
  const backLogos  = texturesLogos.filter((it) => it.type === 'backLogo');

  const mapKind = (type) => {
    if (type === 'texture')   return 'full';
    if (type === 'frontLogo') return 'front_logo';
    if (type === 'backLogo')  return 'back_logo';
    return 'unknown';
  };

  const onPick = (image) => {
    try {
      logEvent('apply_texture', {
        kind: mapKind(image?.type),
        name: image?.name || undefined,
      });
    } catch {}
    handleTextureLogoClick?.(image);
  };

  const renderImages = (images) => (
    <div className="grid grid-cols-2 gap-2">
      {images.map((image, idx) => {
        // Key luôn duy nhất & không rỗng
        const safeKey = `${image.type || 'item'}::${image.name || image.image || idx}`;
        return (
          <button
            type="button"
            key={safeKey}
            onClick={() => onPick(image)}
            className="rounded-full overflow-hidden focus:outline-none"
            title={image.name}
          >
            <img src={image.image} alt={image.name} className="w-full h-auto" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="absolute left-full ml-3 space-y-2">
      <div>
        <h2 className="font-medium mb-1">Hoạ tiết</h2>
        <div className="flex flex-wrap overflow-y-scroll w-40 h-40">
          {renderImages(textures)}
        </div>
      </div>

      <div>
        <h2 className="font-medium mb-1">Logo trước</h2>
        <div className="flex flex-wrap overflow-y-scroll w-40 h-40">
          {renderImages(frontLogos)}
        </div>
      </div>

      <div>
        <h2 className="font-medium mb-1">Logo sau</h2>
        <div className="flex flex-wrap overflow-y-scroll w-40 h-40">
          {renderImages(backLogos)}
        </div>
      </div>
    </div>
  );
};

export default TextureLogoPicker;
