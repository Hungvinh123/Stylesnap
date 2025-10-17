// src/components/TourOverlay.jsx
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

function getRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height };
}

function useStepRect(selector) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    function update() {
      setRect(getRect(selector));
    }
    update();
    const ro = new ResizeObserver(update);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const id = setInterval(update, 250); // đề phòng layout động

    return () => {
      clearInterval(id);
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [selector]);
  return rect;
}

export default function TourOverlay({
  steps,
  storageKey = "tour_customizer_v1",
  onlyFirstTime = true,
}) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  // bật khi chưa seen
  useEffect(() => {
    if (onlyFirstTime) {
      const seen = localStorage.getItem(storageKey);
      if (!seen) setVisible(true);
    } else {
      setVisible(true);
    }
  }, [storageKey, onlyFirstTime]);

  const step = steps?.[index] ?? null;
  const rect = useStepRect(step?.selector || "");
  const overlayRef = useRef(null);

  const tooltipStyle = useMemo(() => {
    if (!rect) return { left: 24, top: 24 };
    const gap = 8;
    const place = step?.placement || "right";
    const centerY = rect.y + rect.h / 2;
    const centerX = rect.x + rect.w / 2;

    let top = rect.y, left = rect.x + rect.w + gap;

    if (place === "left") {
      left = rect.x - 280 - gap;
      top = rect.y;
    }
    if (place === "top") {
      left = rect.x;
      top = rect.y - 110 - gap;
    }
    if (place === "bottom") {
      left = rect.x;
      top = rect.y + rect.h + gap;
    }
    // đảm bảo trong viewport phần nào đó
    return {
      left: Math.max(16, Math.min(left, window.scrollX + window.innerWidth - 320)),
      top: Math.max(16, Math.min(top, window.scrollY + window.innerHeight - 120)),
    };
  }, [rect, step]);

  if (!visible || !step) return null;

  const total = steps.length;
  const isLast = index === total - 1;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-label="Hướng dẫn sử dụng"
    >
      {/* lớp mờ nền */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* spotlight */}
      {rect && (
        <div
          className="absolute rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.40)] bg-transparent"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
            outline: "2px solid rgba(255,255,255,0.8)",
            transition: "all 0.2s ease",
          }}
        />
      )}

      {/* tooltip */}
      <div
        className="absolute w-[300px] pointer-events-auto"
        style={tooltipStyle}
      >
        <div className="rounded-xl bg-white shadow-xl ring-1 ring-black/10 p-3">
          <div className="text-[11px] text-gray-500 mb-1">
            Hướng dẫn {index + 1}/{total}
          </div>
          <div className="font-semibold">{step.title}</div>
          {step.content && <div className="text-sm text-gray-700 mt-1">{step.content}</div>}

          <div className="mt-3 flex items-center justify-between">
            <button
              className="text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                localStorage.setItem(storageKey, "1");
                setVisible(false);
              }}
            >
              Bỏ qua
            </button>
            <div className="space-x-2">
              {index > 0 && (
                <button
                  className="px-2 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  Quay lại
                </button>
              )}
              <button
                className="px-2 py-1 text-sm rounded-lg bg-black text-white hover:bg-gray-900"
                onClick={() => {
                  if (isLast) {
                    localStorage.setItem(storageKey, "1");
                    setVisible(false);
                  } else {
                    setIndex((i) => Math.min(total - 1, i + 1));
                  }
                }}
              >
                {isLast ? "Hoàn tất" : "Tiếp tục"}
              </button>
            </div>
          </div>
        </div>
        {/* mũi tên đơn giản */}
      </div>
    </div>
  );
}
