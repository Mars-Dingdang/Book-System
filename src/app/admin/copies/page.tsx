import QRCode from "qrcode";
import AdminCopyManager from "@/components/AdminCopyManager";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type CopyWithBook = {
  id: number;
  copyCode: string;
  status: string;
  location: string | null;
  qrCodeUrl: string | null;
  book: { title: string };
};

export default async function AdminCopiesPage() {
  await requirePageAdmin();
  const copies = await prisma.bookCopy.findMany({ include: { book: true }, orderBy: { copyCode: "asc" } });
  const qrCodes = await Promise.all(copies.map((copy: CopyWithBook) => QRCode.toDataURL(copy.qrCodeUrl || copy.copyCode, { margin: 1, width: 128 })));
  const rows = copies.map((copy: CopyWithBook, index: number) => ({
    id: copy.id,
    copyCode: copy.copyCode,
    status: copy.status,
    location: copy.location,
    qrCode: qrCodes[index],
    book: { title: copy.book.title },
  }));

  return (
    <div className="stack">
      <h1>实体书管理</h1>
      <AdminCopyManager copies={rows} />
    </div>
  );
}
