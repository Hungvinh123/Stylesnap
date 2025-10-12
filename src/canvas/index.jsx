// src/canvas/index.jsx
import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Center } from '@react-three/drei';
import Shirt from './Shirt';
import CameraRig from './CameraRig';

/** Bridge bên trong Canvas để expose capture helpers */
function CaptureBridge({ modelRef }) {
  const { gl, invalidate } = useThree();

  const captureOnce = () =>
    new Promise((resolve, reject) => {
      try {
        requestAnimationFrame(() => {
          const c = gl.domElement;
          if (!c) return reject(new Error('NO_CANVAS'));
          c.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('BLOB_FAIL'))),
            'image/jpeg',
            0.92
          );
        });
      } catch (e) { reject(e); }
    });

  const rotateAndCapture = async (targetY) => {
    const root = modelRef?.current;
    const prev = root ? root.rotation.y : 0;

    if (root) root.rotation.y = targetY;
    // ép render và đợi 2 frame cho chắc chắn frame mới
    invalidate();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);

    const blob = await captureOnce();

    if (root) { root.rotation.y = prev; invalidate(); }
    return blob;
  };

  useEffect(() => {
    window.appCapture = {
      front: () => rotateAndCapture(0),
      back:  () => rotateAndCapture(Math.PI),
    };
    return () => { delete window.appCapture; };
  }, []);

  return null;
}

const CanvasModel = () => {
  const modelRef = useRef(null);

  return (
    <Canvas
      camera={{ position: [0, 0, 0], fov: 25 }}
      gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      className="w-full max-w-full h-full transition-all ease-in"
      dpr={[1, 2]}
    >
      <ambientLight intensity={0.5} />

      <CameraRig>
        <Center>
          <group ref={modelRef}>
            <Shirt />
          </group>
        </Center>
      </CameraRig>

      <CaptureBridge modelRef={modelRef} />
    </Canvas>
  );
};

export default CanvasModel;
