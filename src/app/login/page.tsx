import Link from "next/link";
import { LoginForm } from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="stack" style={{ maxWidth: 440, margin: "40px auto" }}>
      <h1>登录</h1>
      <LoginForm />
      <Link className="muted" href="/register">还没有账号？去注册</Link>
    </div>
  );
}
