// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import './index.css';

import { NotifyProvider } from './store/notify';
import ToastContainer from './components/ToastContainer';

import Home from './pages/Home';
import CustomizePage from './pages/Customizer';
import Login from './pages/Login';
import Register from './pages/Register';
import Header from './components/Header';
import { AuthProvider, useAuth } from './store/auth';

import { initGA, pageview } from './lib/ga';   // <-- THÊM

// Route guard: đợi booting xong mới quyết định
function Protected({ children }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div className="w-full h-screen grid place-items-center text-gray-500">
        Loading…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

// Theo dõi chuyển trang để bắn GA page_view
function AnalyticsRouter() {
  const location = useLocation();
  React.useEffect(() => {
    pageview(location.pathname + location.search);
  }, [location]);
  return null;
}

const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-white">
    <Header />
    <AnalyticsRouter />   {/* <-- THÊM */}
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

// Component boot để init GA một lần
function Boot() {
  React.useEffect(() => { initGA(); }, []);
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <NotifyProvider>
    <AuthProvider>
      <ToastContainer />
      <Boot />
    </AuthProvider>
  </NotifyProvider>
);
