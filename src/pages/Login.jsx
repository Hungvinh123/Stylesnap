import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { useNotify } from '../store/notify'; // ⬅️ thêm

const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const notify = useNotify();              // ⬅️ thêm
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOk(email)) return setErr('Email không hợp lệ');
    if (!pwd) return setErr('Vui lòng nhập mật khẩu');
    try {
      await login(email, pwd);
      notify.show('Đăng nhập thành công', 'success'); // ⬅️ thêm
      nav('/customize');
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="page-wrap flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        {err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        <label className="block mb-3">
          <span className="text-sm text-gray-600">Email</span>
          <input className="mt-1 w/full border rounded-xl px-3 py-2" type="email"
            value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <label className="block mb-4">
          <span className="text-sm text-gray-600">Password</span>
          <input className="mt-1 w/full border rounded-xl px-3 py-2" type="password"
            value={pwd} onChange={(e)=>setPwd(e.target.value)} required />
        </label>
        <button className="w-full rounded-xl bg-black text-white py-2">Login</button>
        <div className="mt-4 text-center text-sm text-gray-600">
          Chưa có tài khoản? <Link className="text-black underline" to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
