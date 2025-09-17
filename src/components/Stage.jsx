import React, { Suspense } from 'react';
// CanvasModel là export default của src/canvas/index.jsx
import CanvasModel from '../canvas';

export default function Stage() {
  return (
    <div className="canvas-wrap">
      <Suspense fallback={null}>
        <CanvasModel />
      </Suspense>
    </div>
  );
}
