import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

export default function PaymentReturn() {
  const [params] = useSearchParams();

  useEffect(() => {
    const paymentId = params.get("paymentId");
    const designId = params.get("designId");
    const code = params.get("vnp_ResponseCode");
    const txn = params.get("vnp_TransactionNo");

    axios.post("/api/payment/confirm", {
      paymentId,
      designId,
      vnp_ResponseCode: code,
      transactionId: txn,
    }).then(res => {
      if (res.data.status === "success") {
        alert("Thanh toán thành công! Bạn có thể tải thiết kế.");
      } else {
        alert("Thanh toán thất bại!");
      }
    });
  }, []);

  return <h2>Đang xử lý thanh toán...</h2>;
}
