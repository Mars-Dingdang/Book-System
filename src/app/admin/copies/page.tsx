import QRCode from "qrcode";
import Link from "next/link";
import BookCopyStatusBadge from "@/components/BookCopyStatusBadge";
import CopyActions from "@/components/CopyActions";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminCopiesPage({ searchParams }: { searchParams: { print?: string } }) {
  await requirePageAdmin();
  const copies = await prisma.bookCopy.findMany({ include: { book: true }, orderBy: { copyCode: "asc" } });
  const qrCodes = await Promise.all(copies.map((copy) => QRCode.toDataURL(copy.qrCodeUrl || copy.copyCode, { margin: 1, width: 128 })));

  if (searchParams.print === "1") {
    return (
      <div className="qr-grid">
        {copies.map((copy, index) => (
          <div className="qr-label" key={copy.id}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={copy.copyCode} src={qrCodes[index]} />
            <strong>{copy.copyCode}</strong>
            <p>{copy.book.title}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="row">
        <h1>实体书管理</h1>
        <Link className="button secondary" href="/admin/copies?print=1">打印二维码</Link>
      </div>
      <table>
        <thead><tr><th>二维码</th><th>书名</th><th>编号</th><th>状态</th><th>位置</th><th>修改状态</th></tr></thead>
        <tbody>
          {copies.map((copy, index) => (
            <tr key={copy.id}>
              <td>{/* eslint-disable-next-line @next/next/no-img-element */}<img alt={copy.copyCode} src={qrCodes[index]} width={64} height={64} /></td>
              <td>{copy.book.title}</td>
              <td><Link href={`/book-copy/${copy.copyCode}`}>{copy.copyCode}</Link></td>
              <td><BookCopyStatusBadge status={copy.status} /></td>
              <td>{copy.location || "-"}</td>
              <td><CopyActions id={copy.id} status={copy.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
