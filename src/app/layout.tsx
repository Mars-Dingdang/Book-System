import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "上海中学化学竞赛图书借阅系统",
  description: "扫码借还书和后台管理",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body>
        <nav className="nav">
          <Link className="brand" href="/">
            <Image src="/page-logo.png" alt="上海中学" width={163} height={48} priority />
            <span>化学竞赛组图书借阅</span>
          </Link>
          <div className="nav-links">
            <Link href="/books">图书</Link>
            <Link href="/borrow/scan">借书</Link>
            <Link href="/return/scan">还书</Link>
            <Link href="/me/borrowed">我的借阅</Link>
            {user ? <Link href="/me/profile">个人中心</Link> : null}
            {user?.role === "ADMIN" ? <Link href="/admin">后台</Link> : null}
            {user?.role === "ADMIN" ? <Link href="/admin/users">用户管理</Link> : null}
            {user ? <span className="muted">{user.name}</span> : <Link href="/login">登录</Link>}
            {user ? <LogoutButton /> : null}
          </div>
        </nav>
        <main className="shell">{children}</main>
      </body>
    </html>
  );
}
