import Link from "next/link";
import { notFound } from "next/navigation";
import BookCopyStatusBadge from "@/components/BookCopyStatusBadge";
import { prisma } from "@/lib/db";

export default async function BookDetailPage({ params }: { params: { id: string } }) {
  const book = await prisma.book.findUnique({
    where: { id: Number(params.id) },
    include: { copies: { orderBy: { copyCode: "asc" } } },
  });
  if (!book) notFound();

  return (
    <div className="stack">
      <h1>{book.title}</h1>
      <div className="panel stack">
        <p>作者：{book.author || "未填写"}</p>
        <p>出版社：{book.publisher || "未填写"}</p>
        <p>分类：{book.category || "未分类"}</p>
        <p>资料类型：{book.sourceType}</p>
        <p className="muted">{book.description || "暂无简介"}</p>
      </div>
      <h2>实体副本</h2>
      <table>
        <thead><tr><th>编号</th><th>状态</th><th>位置</th></tr></thead>
        <tbody>
          {book.copies.map((copy) => (
            <tr key={copy.id}>
              <td><Link href={`/book-copy/${copy.copyCode}`}>{copy.copyCode}</Link></td>
              <td><BookCopyStatusBadge status={copy.status} /></td>
              <td>{copy.location || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
