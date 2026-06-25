"use client";

import { useCallback, useState } from "react";
import QRScanner from "./QRScanner";

export default function ScanAction({ mode }: { mode: "borrow" | "return" }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const endpoint = mode === "borrow" ? "/api/borrow" : "/api/return";

  const onScan = useCallback(
    async (copyCode: string) => {
      setMessage("");
      setError("");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyCode }),
      });
      const body = await res.json();
      if (body.success) {
        setMessage(body.message);
      } else {
        setError(body.message || "操作失败");
      }
    },
    [endpoint],
  );

  return (
    <div className="stack">
      {message ? <div className="message">{message}</div> : null}
      {error ? <div className="message error">{error}</div> : null}
      <QRScanner onScan={onScan} onError={() => setError("无法打开摄像头，请检查权限或手动输入编号")} />
    </div>
  );
}
