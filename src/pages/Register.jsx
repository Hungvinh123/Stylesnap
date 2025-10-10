// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useNotify } from '../store/notify';
import GoogleLoginButton from '../components/GoogleLoginButton';

const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const passOk  = (s) => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(s);

export default function Register() {
  const nav = useNavigate();
  const location = useLocation();
  const next = location.state?.from ?? '/customize';

  const { register } = useAuth();
  const notify = useNotify();
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOk(form.email)) return setErr('Email không hợp lệ');
    if (!passOk(form.password)) return setErr('Mật khẩu tối thiểu 8 ký tự, có chữ & số');
    try {
      await register(form);
      notify.show('Đăng ký thành công', 'success');
      nav(next);
    } catch (e) {
      setErr(e.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="page-wrap flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
        <h2 className="text-2xl font-semibold mb-4">Tạo tài khoản mới</h2>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Họ và tên</span>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            value={form.full_name}
            onChange={(e)=>setForm({...form, full_name:e.target.value})}
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-gray-600">Email</span>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            type="email"
            required
            value={form.email}
            onChange={(e)=>setForm({...form, email:e.target.value})}
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-600">Mật khẩu</span>
          <input
            className="mt-1 w-full border rounded-xl px-3 py-2"
            type="password"
            required
            value={form.password}
            onChange={(e)=>setForm({...form, password:e.target.value})}
          />
        </label>

        <button type="submit" className="w-full rounded-xl bg-black text-white py-2">Đăng ký ngay</button>

        <div className="mt-3">
          <GoogleLoginButton next={next} onDone={() => nav(next)} />
        </div>

        <div className="mt-4 text-center text-sm text-gray-600">
          Đã có tài khoản? <Link className="text-black underline" to="/login">Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
}
