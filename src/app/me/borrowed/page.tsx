import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MyBorrowedPage() {
  const user = await requirePageAuth();
  const records = await prisma.borrowRecord.findMany({
    where: { userId: user.id, returnedAt: null, status: "BORROWED" },
    include: { bookCopy: { include: { book: true } } },
    orderBy: { borrowedAt: "desc" },
  });

  return (
    <div className="stack">
      <h1>当前借阅</h1>
      <table>
        <thead><tr><th>书名</th><th>编号</th><th>借出时间</th><th>应还时间</th></tr></thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.bookCopy.book.title}</td>
              <td><Link href={`/book-copy/${record.bookCopy.copyCode}`}>{record.bookCopy.copyCode}</Link></td>
              <td>{record.borrowedAt.toLocaleString("zh-CN")}</td>
              <td>{record.dueAt?.toLocaleDateString("zh-CN") || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
