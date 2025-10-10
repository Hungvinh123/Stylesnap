import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const linkBase = 'px-3 py-2 rounded-xl text-sm font-medium';
  const active = ({ isActive }) =>
    isActive ? `${linkBase} bg-black text-white` : `${linkBase} text-gray-700 hover:bg-gray-100`;

  const displayName = user?.full_name || user?.name || user?.email || 'User';

  const doLogout = async () => {
    try {
      await logout();
    } finally {
      nav('/home');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-7xl px-4 h-18">
        <div className="flex items-center gap-4 py-4">
          {/* LEFT: Brand */}
          <div className="flex-none">
            <Link to="/home" className="flex items-center gap-2">
              <img src="/threejs.png" alt="logo" className="h-6 w-6" />
              <span className="text-lg font-semibold">Stylesnap</span>
            </Link>
          </div>

          {/* CENTER: Main Nav */}
          <nav className="flex-1 flex items-center justify-center gap-2">
            <NavLink to="/home" className={active}>Trang chủ</NavLink>
            <NavLink to="/customize" className={active}>Tạo mẫu mới</NavLink>
          </nav>

          {/* RIGHT: Auth/User area */}
          <div className="flex-none ml-auto flex items-center gap-2 min-w-0">
            {!user && (
              <>
                <NavLink to="/login" className={active}>Đăng nhập</NavLink>
                <NavLink to="/register" className={active}>Đăng ký</NavLink>
              </>
            )}

            {user && (
              <div className="flex items-center gap-2 min-w-0">
                {/* Tên người dùng co giãn, tránh đẩy nút */}
                <span
                  className="max-w-[200px] sm:max-w-[260px] truncate text-sm text-gray-700"
                  title={displayName}
                >
                 Xin chào,&nbsp;{displayName}
                </span>
                <button
                  className="shrink-0 px-3 py-2 rounded-xl text-sm bg-gray-900 text-white hover:opacity-90"
                  onClick={doLogout}
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
