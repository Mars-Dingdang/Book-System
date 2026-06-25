import { notFound } from "next/navigation";
import BookCopyActionButtons from "@/components/BookCopyActionButtons";
import BookCopyStatusBadge from "@/components/BookCopyStatusBadge";
import { getCurrentUser } from "@/lib/auth";
import { parseCopyCodeFromQrText } from "@/lib/copyCode";
import { prisma } from "@/lib/db";

export default async function BookCopyPage({ params }: { params: { copyCode: string } }) {
  const user = await getCurrentUser();
  const copyCode = parseCopyCodeFromQrText(decodeURIComponent(params.copyCode));
  const copy = await prisma.bookCopy.findUnique({
    where: { copyCode },
    include: {
      book: true,
      borrowRecords: { where: { returnedAt: null }, include: { user: true }, orderBy: { borrowedAt: "desc" } },
    },
  });
  if (!copy) notFound();
  const currentRecord = copy.borrowRecords[0];
  const canReturn = Boolean(user && currentRecord && (currentRecord.userId === user.id || user.role === "ADMIN"));

  return (
    <div className="stack">
      <h1>{copy.book.title}</h1>
      <div className="panel stack">
        <p>实体书编号：{copy.copyCode}</p>
        <p>位置：{copy.location || "-"}</p>
        <p>状态：<BookCopyStatusBadge status={copy.status} /></p>
        {currentRecord ? <p className="muted">当前借阅人：{currentRecord.user.name}</p> : null}
      </div>
      {user ? <BookCopyActionButtons copyCode={copy.copyCode} canReturn={canReturn} /> : <p className="muted">请先登录后借还书。</p>}
    </div>
  );
}
