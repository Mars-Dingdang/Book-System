import ForceReturnButton from "@/components/ForceReturnButton";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminBorrowRecordsPage({ searchParams }: { searchParams: { active?: string } }) {
  await requirePageAdmin();
  const records = await prisma.borrowRecord.findMany({
    where: searchParams.active === "1" ? { returnedAt: null } : {},
    include: { user: true, bookCopy: { include: { book: true } } },
    orderBy: { borrowedAt: "desc" },
  });

  return (
    <div className="stack">
      <div className="row">
        <h1>借阅记录</h1>
        <div className="row">
          <a className="button secondary" href="/admin/borrow-records?active=1">当前借出</a>
          <a className="button secondary" href="/api/admin/export/borrow-records">导出记录</a>
        </div>
      </div>
      <table>
        <thead><tr><th>书名</th><th>编号</th><th>借阅人</th><th>借出</th><th>应还</th><th>归还</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>{record.bookCopy.book.title}</td>
              <td>{record.bookCopy.copyCode}</td>
              <td>{record.user.name} ({record.user.studentId})</td>
              <td>{record.borrowedAt.toLocaleString("zh-CN")}</td>
              <td>{record.dueAt?.toLocaleDateString("zh-CN") || "-"}</td>
              <td>{record.returnedAt?.toLocaleString("zh-CN") || "-"}</td>
              <td>{record.status}</td>
              <td>{record.returnedAt ? null : <ForceReturnButton id={record.id} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
