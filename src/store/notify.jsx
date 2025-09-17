import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

const NotifyCtx = createContext(null);
export const useNotify = () => useContext(NotifyCtx);

export function NotifyProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const api = useMemo(() => ({
    show: (message, type = 'success', duration = 3000) => {
      const id = ++idRef.current;
      setToasts((ts) => [...ts, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((ts) => ts.filter(t => t.id !== id));
        }, duration);
      }
    },
    dismiss: (id) => setToasts((ts) => ts.filter(t => t.id !== id)),
  }), []);

  return (
    <NotifyCtx.Provider value={{ ...api, toasts }}>
      {children}
    </NotifyCtx.Provider>
  );
}
