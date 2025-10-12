// src/components/DesignList.jsx
import { useEffect, useState } from "react";

export default function DesignList({ userId }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    let aborted = false;

    async function load() {
      setLoading(true);
      setErrMsg("");

      try {
        const res = await fetch(`/api/designs/${userId}`, {
          credentials: "include", // kèm cookie phiên
        });

        // Tránh lỗi "Unexpected end of JSON input" khi server 500/HTML
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        }

        // Chỉ parse JSON khi header đúng; nếu không, fallback text -> []
        const ct = res.headers.get("content-type") || "";
        const data = ct.includes("application/json") ? await res.json() : [];

        if (!aborted) setDesigns(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Fetch designs error:", e);
        if (!aborted) {
          setErrMsg("Không tải được danh sách thiết kế. Vui lòng thử lại.");
          setDesigns([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    if (userId) load();
    return () => { aborted = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="mt-6 text-gray-500 animate-pulse">
        Đang tải thiết kế…
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="mt-6 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
        {errMsg}
      </div>
    );
  }

  if (!designs.length) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-gray-50">
        <p className="text-gray-700">
          Chưa có mẫu thiết kế nào.{" "}
          <a
            href="/customize"
            className="underline underline-offset-2 text-blue-600 hover:text-blue-700"
          >
            Bắt đầu thiết kế ngay!
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {designs.map((d) => {
        const thumb =
          d.thumbnailUrl || d.previewFrontUrl || d.previewBackUrl || "";
        const created =
          d.createdAt ? new Date(d.createdAt) : new Date();

        return (
          <div key={d.id} className="rounded-lg shadow-md p-3 bg-white">
            {thumb ? (
              <img
                src={thumb}
                alt={d.title || `Thiết kế #${d.id}`}
                className="w-full h-40 object-cover rounded"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                Không có ảnh
              </div>
            )}

            <h3 className="mt-2 text-base font-semibold truncate">
              {d.title || `Thiết kế #${d.id}`}
            </h3>

            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
              <span>{created.toLocaleString()}</span>
              {d.colorHex ? (
                <span className="inline-flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: d.colorHex }}
                    title={d.colorHex}
                  />
                  {d.colorHex}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
