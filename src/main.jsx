import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css';

import { NotifyProvider } from './store/notify';     // ⬅️ dùng
import ToastContainer from './components/ToastContainer'; // ⬅️ dùng

import Home from './pages/Home';
import CustomizePage from './pages/Customizer';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import { AuthProvider, useAuth } from './store/auth';

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-white">
    <Header />
    {children}
  </div>
);

const router = createBrowserRouter([
  { path: '/',       element: <AppLayout><Home /></AppLayout> },
  { path: '/home',   element: <AppLayout><Home /></AppLayout> },
  {
    path: '/customize',
    element: (
      <AppLayout>
        <Protected>
          <CustomizePage />
        </Protected>
      </AppLayout>
    ),
  },
  { path: '/login',    element: <AppLayout><Login /></AppLayout> },
  { path: '/register', element: <AppLayout><Register /></AppLayout> },
  { path: '*',         element: <Navigate to="/home" replace /> }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <NotifyProvider>               {/* ⬅️ bọc Notify */}
    <AuthProvider>
      <ToastContainer />         {/* ⬅️ mount container 1 lần ở root */}
      <RouterProvider router={router} />
    </AuthProvider>
  </NotifyProvider>
);
