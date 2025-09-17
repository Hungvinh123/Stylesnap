import React from 'react';
import { useNotify } from '../store/notify';

export default function ToastContainer() {
  const { toasts, dismiss } = useNotify();

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div className="toast-msg">{t.message}</div>
          <button className="toast-close" onClick={() => dismiss(t.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
