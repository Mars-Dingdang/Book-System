import Link from "next/link";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  await requirePageAdmin();
  const [bookCount, copyCount, availableCount, borrowedCount, damagedCount, lostCount, recent] = await Promise.all([
    prisma.book.count(),
    prisma.bookCopy.count(),
    prisma.bookCopy.count({ where: { status: "AVAILABLE" } }),
    prisma.bookCopy.count({ where: { status: "BORROWED" } }),
    prisma.bookCopy.count({ where: { status: "DAMAGED" } }),
    prisma.bookCopy.count({ where: { status: "LOST" } }),
    prisma.borrowRecord.findMany({
      take: 8,
      include: { user: true, bookCopy: { include: { book: true } } },
      orderBy: { borrowedAt: "desc" },
    }),
  ]);
  const overdueCount = await prisma.borrowRecord.count({ where: { status: "BORROWED", dueAt: { lt: new Date() }, returnedAt: null } });

  return (
    <div className="stack">
      <div className="row">
        <h1>管理员后台</h1>
        <div className="row">
          <Link className="button secondary" href="/admin/books">书目管理</Link>
          <Link className="button secondary" href="/admin/copies">实体书管理</Link>
          <Link className="button secondary" href="/admin/borrow-records">借阅记录</Link>
        </div>
      </div>
      <div className="grid">
        {[
          ["书目总数", bookCount],
          ["实体书总数", copyCount],
          ["当前可借", availableCount],
          ["当前借出", borrowedCount],
          ["超期未还", overdueCount],
          ["损坏", damagedCount],
          ["丢失", lostCount],
        ].map(([label, value]) => <div className="card" key={label}><strong>{value}</strong><p className="muted">{label}</p></div>)}
      </div>
      <h2>最近借阅</h2>
      <table>
        <thead><tr><th>书名</th><th>编号</th><th>借阅人</th><th>时间</th><th>状态</th></tr></thead>
        <tbody>
          {recent.map((record) => (
            <tr key={record.id}>
              <td>{record.bookCopy.book.title}</td>
              <td>{record.bookCopy.copyCode}</td>
              <td>{record.user.name}</td>
              <td>{record.borrowedAt.toLocaleString("zh-CN")}</td>
              <td>{record.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
