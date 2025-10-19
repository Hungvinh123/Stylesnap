import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

export default function Header() {
  const nav = useNavigate();

  const linkBase = 'px-3 py-2 rounded-xl text-sm font-medium';
  const active = ({ isActive }) =>
    isActive ? `${linkBase} bg-black text-white` : `${linkBase} text-gray-700 hover:bg-gray-100`;


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
          
        </div>
      </div>
    </header>
  );
}
