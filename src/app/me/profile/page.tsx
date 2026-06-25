import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ProfilePage() {
  const user = await requirePageAuth();
  const records = await prisma.borrowRecord.findMany({
    where: { userId: user.id },
    take: 12,
    include: { bookCopy: { include: { book: true } } },
    orderBy: { borrowedAt: "desc" },
  });

  return (
    <div className="stack">
      <div className="row">
        <h1>个人中心</h1>
        <Link className="button secondary" href="/me/history">全部借阅记录</Link>
      </div>
      <ProfileForm user={user} />
      <section className="panel stack">
        <h2>最近借阅记录</h2>
        <table>
          <thead><tr><th>书名</th><th>编号</th><th>借出</th><th>归还</th><th>状态</th></tr></thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.bookCopy.book.title}</td>
                <td><Link href={`/book-copy/${record.bookCopy.copyCode}`}>{record.bookCopy.copyCode}</Link></td>
                <td>{record.borrowedAt.toLocaleString("zh-CN")}</td>
                <td>{record.returnedAt?.toLocaleString("zh-CN") || "-"}</td>
                <td>{record.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
