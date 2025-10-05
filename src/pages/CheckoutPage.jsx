// src/pages/CheckoutPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CheckoutPage = () => {
  const [method, setMethod] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const nav = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleConfirm = async () => {
  if (!form.name || !form.phone || !form.address) {
    return alert("Vui lòng nhập đầy đủ thông tin giao hàng");
  }
  if (!method) {
    return alert("Vui lòng chọn phương thức thanh toán");
  }

  // chụp preview canvas (nếu đang ở Customizer thì sẽ có canvas)
  const canvas = document.querySelector("canvas");
  const preview = canvas ? canvas.toDataURL("image/png") : null;

  try {
    await fetch("http://localhost:3000/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        preview,
      }),
    });
  } catch (e) {
    console.error("Gửi mail thất bại", e);
  }

  if (method === "cod") {
    alert(`Đặt hàng thành công! Sẽ giao tới ${form.address}`);
  } else if (method === "qr") {
    alert("Vui lòng quét mã QR để thanh toán.");
  }

  nav("/home");
};


  return (
    <div className="w-full min-h-screen flex flex-col items-center py-10 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Thanh toán đơn hàng</h1>

      {/* Form thông tin giao hàng */}
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="Họ và tên"
            value={form.name}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <input
            type="text"
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email (không bắt buộc)"
            value={form.email}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
          <textarea
            name="address"
            placeholder="Địa chỉ giao hàng"
            value={form.address}
            onChange={handleChange}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Chọn phương thức thanh toán */}
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="method"
              value="cod"
              checked={method === "cod"}
              onChange={() => setMethod("cod")}
            />
            Thanh toán khi nhận hàng (COD)
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="method"
              value="qr"
              checked={method === "qr"}
              onChange={() => setMethod("qr")}
            />
            Quét QR Code
          </label>
        </div>

        {method === "qr" && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <p className="mb-2">Quét mã QR sau để thanh toán:</p>
            <img
              src="/qrcode.jpg"
              alt="QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleConfirm}
        className="px-6 py-3 bg-black text-white rounded-lg font-semibold"
      >
        Xác nhận đơn hàng
      </button>
    </div>
  );
};

export default CheckoutPage;
