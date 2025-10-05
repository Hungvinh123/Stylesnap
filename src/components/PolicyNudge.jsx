import React, { useEffect, useState } from 'react';

/** Nudge hiển thị 1 lần, cho phép tắt vĩnh viễn qua localStorage */
export default function PolicyNudge({ policyUrl = '/chinh-sach/noi-dung-khach-hang' }) {
  const KEY = 'stylesnap_ack_ip_policy_v1';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(KEY);
    if (!seen) setOpen(true);
  }, []);

  const acknowledge = () => {
    localStorage.setItem(KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="
        fixed left-4 bottom-4 z-50 max-w-sm
        rounded-2xl bg-white/95 backdrop-blur
        shadow-xl ring-1 ring-black/5
        px-4 py-3 flex gap-3 items-start
      "
      style={{ pointerEvents: 'auto' }}
    >
      {/* Icon shield (SVG thuần, tránh thêm lib) */}
      <div className="mt-0.5">
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-amber-600" fill="currentColor" aria-hidden>
          <path d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5l-8-3Zm0 2.2 6 2.2v4.6c0 4-2.6 7.8-6 9-3.4-1.2-6-5-6-9V6.4l6-2.2ZM11 7h2v6h-2V7Zm0 8h2v2h-2v-2Z"/>
        </svg>
      </div>

      <div className="text-[13px] leading-snug text-gray-700">
        <strong>Lời nhắc nhỏ:</strong> Vui lòng chỉ tải lên hình/biểu trưng bạn có quyền sử dụng.
        Chúng tôi in theo yêu cầu và <span className="font-medium">không xác minh quyền sở hữu</span>;
        bạn tự chịu trách nhiệm về nội dung đã tải lên.{' '}
        
        <div className="mt-2 flex gap-2">
          <button
            onClick={acknowledge}
            className="px-2.5 py-1 rounded-md bg-amber-600 text-white text-xs font-medium hover:bg-amber-700"
          >
            Tôi hiểu
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs hover:bg-gray-200"
          >
            Ẩn tạm
          </button>
        </div>
      </div>
    </div>
  );
}
