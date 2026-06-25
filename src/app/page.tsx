import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HomePage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requirePageAuth();
  const q = searchParams.q?.trim();
  const [books, borrowed, pendingCount] = await Promise.all([
    prisma.book.findMany({
      take: 24,
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { author: { contains: q } },
              { publisher: { contains: q } },
              { isbn: { contains: q } },
              { copies: { some: { copyCode: { contains: q } } } },
            ],
          }
        : {},
      include: { copies: true },
      orderBy: { id: "desc" },
    }),
    prisma.borrowRecord.findMany({
      where: { userId: user.id, returnedAt: null, status: "BORROWED" },
      include: { bookCopy: { include: { book: true } } },
      orderBy: { borrowedAt: "desc" },
    }),
    user.role === "ADMIN" ? prisma.user.count({ where: { approvalStatus: "PENDING" } }) : Promise.resolve(0),
  ]);

  return (
    <div className="home-dashboard">
      <section className="home-hero">
        <div>
          <p className="eyebrow">Shanghai High School Library</p>
          <h1>上海中学化学竞赛图书借阅系统</h1>
          <p className="muted">当前登录：{user.name} · {user.username || user.studentId}</p>
        </div>
        <div className="hero-actions">
          <Link className="button" href="/borrow/scan">扫码借书</Link>
          <Link className="button secondary" href="/return/scan">扫码还书</Link>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel stack book-board">
          <div className="row">
            <div>
              <p className="eyebrow">馆藏检索</p>
              <h2>图书列表</h2>
            </div>
            <Link className="button secondary" href="/books">全部图书</Link>
          </div>
          <form className="row">
            <input name="q" placeholder="搜索书名、作者、ISBN、实体编号" defaultValue={q} />
            <button type="submit">搜索</button>
          </form>
          <div className="scroll-cards book-scroll">
            {books.map((book) => {
              const available = book.copies.filter((copy) => copy.status === "AVAILABLE").length;
              return (
                <Link className="library-card" href={`/books/${book.id}`} key={book.id}>
                  <div>
                    <strong>{book.title}</strong>
                    <p className="muted">{book.author || "作者未填写"} · {book.category || "未分类"}</p>
                  </div>
                  <span className={available > 0 ? "badge available" : "badge borrowed"}>可借 {available}/{book.copies.length}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <aside className="stack">
          <div className="panel stack borrowed-board">
            <div className="row">
              <div>
                <p className="eyebrow">我的空间</p>
                <h2>我的借阅</h2>
              </div>
              <span className="badge">{borrowed.length} 本</span>
            </div>
            <div className="scroll-cards">
              {borrowed.length === 0 ? <p className="muted empty-state">当前没有未归还图书</p> : null}
              {borrowed.map((record) => (
                <Link className="library-card compact" href={`/book-copy/${record.bookCopy.copyCode}`} key={record.id}>
                  <div>
                    <strong>{record.bookCopy.book.title}</strong>
                    <p className="muted">{record.bookCopy.copyCode}</p>
                  </div>
                  <span className="muted">{record.dueAt?.toLocaleDateString("zh-CN") || "未设应还"}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="quick-actions">
            <Link className="action-tile" href="/me/profile"><strong>个人中心</strong><span>资料、密码、借阅记录</span></Link>
            <Link className="action-tile" href="/me/history"><strong>历史记录</strong><span>查看借还书流水</span></Link>
            <Link className="action-tile" href="/books"><strong>高级检索</strong><span>按分类和馆藏搜索</span></Link>
            {user.role === "ADMIN" ? <Link className="action-tile admin-tile" href="/admin/users"><strong>用户管理</strong><span>{pendingCount} 个待审核账号</span></Link> : null}
            {user.role === "ADMIN" ? <Link className="action-tile admin-tile" href="/admin"><strong>管理员后台</strong><span>书目、实体书、借阅记录</span></Link> : null}
          </div>
        </aside>
      </section>
    </div>
  );
}
