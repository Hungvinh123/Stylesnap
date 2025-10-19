// src/components/PolicyNudge.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const DISMISS_KEY = 'policyNudge:dismissed:session'; // chỉ cho phiên hiện tại

/**
 * Hiển thị nudge cảnh báo mềm ở /customize.
 * - Mỗi phiên đăng nhập sẽ hiển thị lại (kể cả trước đó user đã ẩn).
 * - Khi user logout -> login/register lại, nudge tự reset và hiện lại.
 * - Dismiss chỉ lưu trong sessionStorage (không vĩnh viễn).
 */
export default function PolicyNudge({
  policyUrl = '/policy/asset-guidelines',
  className = '',
}) {
 
  const [open, setOpen] = useState(true);

  // Khởi tạo: đọc trạng thái ẩn/hiện theo session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
      setOpen(!dismissed);
    } catch {
      // sessionStorage có thể không sẵn (Safari private mode), mặc định mở
      setOpen(true);
    }
  }, []);

  // Khi user chuyển từ null -> có tài khoản (login/register), reset nudge cho phiên mới


  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className={[
        'fixed left-4 bottom-4 z-50 max-w-md rounded-2xl bg-white/95 backdrop-blur-md',
        'shadow-xl ring-1 ring-black/5 p-4 text-sm text-gray-700',
        'flex items-start gap-3',
        className
      ].join(' ')}
      role="dialog"
      aria-live="polite"
      aria-label="Lưu ý về bản quyền nội dung in"
    >
      <div className="shrink-0 h-6 w-6 rounded-full bg-amber-100 grid place-items-center">
        <span className="text-amber-600 font-semibold">i</span>
      </div>

      <div className="min-w-0">
        <div className="font-medium text-gray-900">
          Lưu ý khi dán ảnh/logo
        </div>
        <div className="mt-1 text-gray-700">
          Vui lòng chỉ sử dụng hình ảnh/bộ nhận diện mà bạn có quyền sử dụng.
          Stylesnap không chịu trách nhiệm pháp lý cho các nội dung do khách hàng tự tải lên.
          <Link
            to={policyUrl}
            className="ml-1 underline underline-offset-2 text-amber-700 hover:text-amber-800"
          >
            Xem hướng dẫn
          </Link>
          .
        </div>
      </div>

      <button
        onClick={handleDismiss}
        className="ml-auto shrink-0 -mt-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        aria-label="Đã hiểu"
        title="Đã hiểu"
      >
        Đã hiểu
      </button>
    </div>
  );
}
