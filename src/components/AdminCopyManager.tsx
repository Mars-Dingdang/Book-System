"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BookCopyStatusBadge from "./BookCopyStatusBadge";
import type { CopyStatus } from "@/lib/constants";

type CopyRow = {
  id: number;
  copyCode: string;
  status: string;
  location: string | null;
  qrCode: string;
  book: {
    title: string;
  };
};

function escapePdfText(text: string) {
  return text.replace(/[\\()]/g, "\\$&");
}

function imageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function makeLabelJpeg(copy: CopyRow) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 340;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建标签画布");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#222222";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  const qr = await imageFromDataUrl(copy.qrCode);
  ctx.drawImage(qr, 210, 24, 180, 180);

  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.font = "700 30px Arial, Microsoft YaHei, sans-serif";
  ctx.fillText(copy.copyCode, canvas.width / 2, 242);

  ctx.font = "500 26px Arial, Microsoft YaHei, sans-serif";
  const maxWidth = 520;
  let title = copy.book.title;
  while (ctx.measureText(title).width > maxWidth && title.length > 1) {
    title = `${title.slice(0, -2)}…`;
  }
  ctx.fillText(title, canvas.width / 2, 288);

  return {
    data: canvas.toDataURL("image/jpeg", 0.92).split(",")[1],
    width: canvas.width,
    height: canvas.height,
  };
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function buildPdf(labels: Awaited<ReturnType<typeof makeLabelJpeg>>[]) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;

  function add(chunk: string | Uint8Array) {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    chunks.push(bytes);
    length += bytes.length;
  }

  function object(id: number, body: string | Uint8Array, streamDict = "") {
    offsets[id] = length;
    add(`${id} 0 obj\n`);
    if (body instanceof Uint8Array) {
      add(`<< ${streamDict} /Length ${body.length} >>\nstream\n`);
      add(body);
      add("\nendstream\nendobj\n");
    } else {
      add(`${body}\nendobj\n`);
    }
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 24;
  const labelWidth = 170;
  const labelHeight = 96;
  const gapX = 16;
  const gapY = 14;
  const cols = 3;
  const rows = 7;
  const perPage = cols * rows;
  const pageCount = Math.ceil(labels.length / perPage);
  const imageStart = 4 + pageCount * 2;
  const imageIds = labels.map((_, index) => imageStart + index);
  const contentStart = imageStart + labels.length;
  const contentIds = Array.from({ length: pageCount }, (_, index) => contentStart + index);
  const pageStart = contentStart + pageCount;
  const pageIds = Array.from({ length: pageCount }, (_, index) => pageStart + index);
  const pagesId = pageStart + pageCount;
  const catalogId = pagesId + 1;

  add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  labels.forEach((label, index) => {
    object(
      imageIds[index],
      base64ToBytes(label.data),
      `/Type /XObject /Subtype /Image /Width ${label.width} /Height ${label.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`,
    );
  });

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const start = pageIndex * perPage;
    const commands: string[] = [];
    labels.slice(start, start + perPage).forEach((_, localIndex) => {
      const col = localIndex % cols;
      const row = Math.floor(localIndex / cols);
      const x = margin + col * (labelWidth + gapX);
      const y = pageHeight - margin - labelHeight - row * (labelHeight + gapY);
      commands.push(`q ${labelWidth} 0 0 ${labelHeight} ${x} ${y} cm /Im${start + localIndex} Do Q`);
    });
    object(contentIds[pageIndex], commands.join("\n"));
  }

  pageIds.forEach((pageId, pageIndex) => {
    const start = pageIndex * perPage;
    const resources = labels
      .slice(start, start + perPage)
      .map((_, localIndex) => `/Im${start + localIndex} ${imageIds[start + localIndex]} 0 R`)
      .join(" ");
    object(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << ${resources} >> /Font << /F1 2 0 R >> >> /Contents ${contentIds[pageIndex]} 0 R >>`,
    );
  });

  object(1, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  object(2, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  object(3, `<< /Producer (${escapePdfText("Book-System")}) >>`);
  object(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`);
  object(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const xref = length;
  add(`xref\n0 ${catalogId + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= catalogId; i += 1) {
    add(`${String(offsets[i] || 0).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size ${catalogId + 1} /Root ${catalogId} 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF`);

  const blobParts = chunks.map((chunk) => {
    const copy = new Uint8Array(chunk.byteLength);
    copy.set(chunk);
    return copy.buffer;
  });
  const blob = new Blob(blobParts, { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export default function AdminCopyManager({ copies }: { copies: CopyRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);

  const selectedCopies = copies.filter((copy) => selected.includes(copy.id));
  const allSelected = copies.length > 0 && selected.length === copies.length;

  function toggle(id: number) {
    setSelected((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  async function saveCopy(event: React.FormEvent<HTMLFormElement>, copy: CopyRow) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/book-copies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: copy.id,
        copyCode: form.get("copyCode"),
        location: form.get("location"),
        status: form.get("status"),
      }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    router.refresh();
  }

  async function deleteCopies(ids: number[]) {
    if (ids.length === 0) return;
    if (!window.confirm(`确定删除选中的 ${ids.length} 本实体书吗？此操作不可恢复。`)) return;
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/book-copies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    setSelected([]);
    router.refresh();
  }

  async function printSelected() {
    if (selectedCopies.length === 0) return;
    setPrinting(true);
    setMessage("");
    setError("");
    try {
      const labels = await Promise.all(selectedCopies.map((copy) => makeLabelJpeg(copy)));
      const url = buildPdf(labels);
      const link = document.createElement("a");
      link.href = url;
      link.download = `book-labels-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(`已生成 ${selectedCopies.length} 个实体书标签 PDF`);
    } catch {
      setError("生成 PDF 失败，请稍后重试");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="stack">
      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message">{message}</div> : null}
      <div className="row">
        <div className="row">
          <button className="secondary" type="button" onClick={() => setEditing((value) => !value)}>{editing ? "退出编辑模式" : "进入编辑模式"}</button>
          {editing ? <span className="muted">已选 {selected.length} 本</span> : null}
        </div>
        {editing ? (
          <div className="row">
            <button className="secondary" type="button" onClick={() => setSelected(allSelected ? [] : copies.map((copy) => copy.id))}>{allSelected ? "取消全选" : "全选"}</button>
            <button className="secondary" type="button" disabled={selected.length === 0 || printing} onClick={printSelected}>{printing ? "生成中..." : "打印条码"}</button>
            <button className="danger" type="button" disabled={selected.length === 0} onClick={() => deleteCopies(selected)}>删除选中</button>
          </div>
        ) : null}
      </div>

      <table>
        <thead><tr>{editing ? <th>选择</th> : null}<th>二维码</th><th>书名</th><th>编号</th><th>状态</th><th>位置</th><th>修改状态</th><th>操作</th></tr></thead>
        <tbody>
          {copies.map((copy) => (
            <tr key={copy.id}>
              {editing ? <td><button className={`select-dot ${selected.includes(copy.id) ? "selected" : ""}`} aria-label="选择实体书" type="button" onClick={() => toggle(copy.id)} /></td> : null}
              <td>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={copy.copyCode} src={copy.qrCode} width={64} height={64} />
              </td>
              <td>{copy.book.title}</td>
              <td><Link href={`/book-copy/${copy.copyCode}`}>{copy.copyCode}</Link></td>
              <td><BookCopyStatusBadge status={copy.status} /></td>
              <td>{copy.location || "-"}</td>
              <td>
                <form className="copy-inline-form" onSubmit={(event) => saveCopy(event, copy)}>
                  <select name="status" defaultValue={copy.status}>
                    <option value="AVAILABLE">可借</option>
                    <option value="BORROWED">已借出</option>
                    <option value="DAMAGED">损坏</option>
                    <option value="LOST">丢失</option>
                  </select>
                  {editing ? (
                    <>
                      <input name="copyCode" defaultValue={copy.copyCode} />
                      <input name="location" defaultValue={copy.location || ""} placeholder="位置" />
                    </>
                  ) : (
                    <>
                      <input name="copyCode" type="hidden" defaultValue={copy.copyCode} />
                      <input name="location" type="hidden" defaultValue={copy.location || ""} />
                    </>
                  )}
                  <button type="submit">保存</button>
                </form>
              </td>
              <td><button className="danger" type="button" onClick={() => deleteCopies([copy.id])}>删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
