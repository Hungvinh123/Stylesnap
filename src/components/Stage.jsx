// src/components/Stage.jsx
import React, { Suspense } from 'react';
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
