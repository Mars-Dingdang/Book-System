"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { parseCopyCodeFromQrText } from "@/lib/copyCode";

type QRScannerProps = {
  onScan: (text: string) => void;
  onError?: (error: unknown) => void;
};

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [manual, setManual] = useState("");
  const [running, setRunning] = useState(false);
  const elementId = "qr-reader";

  useEffect(() => {
    let disposed = false;

    async function start() {
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          async (decodedText) => {
            if (disposed) return;
            await scanner.stop();
            setRunning(false);
            onScan(parseCopyCodeFromQrText(decodedText));
          },
          () => undefined,
        );
        setRunning(true);
      } catch (error) {
        onError?.(error);
      }
    }

    start();

    return () => {
      disposed = true;
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => undefined);
      }
    };
  }, [onError, onScan]);

  return (
    <div className="stack">
      <div id={elementId} className="panel" />
      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault();
          if (manual.trim()) onScan(parseCopyCodeFromQrText(manual));
        }}
      >
        <input placeholder="也可以手动输入实体书编号" value={manual} onChange={(event) => setManual(event.target.value)} />
        <button type="submit">确认编号</button>
      </form>
      <span className="muted">{running ? "摄像头已启动" : "如果摄像头不可用，请手动输入编号"}</span>
    </div>
  );
}
