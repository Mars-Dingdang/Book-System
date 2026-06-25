import Link from "next/link";
import { requirePageAuth } from "@/lib/auth";

export default async function HomePage() {
  const user = await requirePageAuth();

  return (
    <div className="stack home">
      <div className="home-hero">
        <div>
          <p className="eyebrow">Shanghai High School Chemistry Olympiad</p>
          <h1>上海中学化学竞赛图书借阅系统</h1>
          <p className="muted">当前登录：{user.name}</p>
        </div>
        <Link className="button" href="/books">进入图书列表</Link>
      </div>
      <div className="grid feature-grid">
        <Link className="card action-card stack" href="/borrow/scan"><strong>扫码借书</strong><span className="muted">扫描二维码或手动输入实体书编号</span></Link>
        <Link className="card action-card stack" href="/return/scan"><strong>扫码还书</strong><span className="muted">归还自己借出的书，管理员可代还</span></Link>
        <Link className="card action-card stack" href="/books"><strong>搜索图书</strong><span className="muted">查看库存和可借状态</span></Link>
        <Link className="card action-card stack" href="/me/borrowed"><strong>当前借阅</strong><span className="muted">查看未归还记录</span></Link>
        <Link className="card action-card stack" href="/me/history"><strong>历史记录</strong><span className="muted">查看借阅和归还历史</span></Link>
        {user.role === "ADMIN" ? <Link className="card action-card stack" href="/admin"><strong>管理员后台</strong><span className="muted">管理书目、实体书和借阅记录</span></Link> : null}
      </div>
    </div>
  );
}
