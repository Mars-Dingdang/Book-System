import Link from "next/link";
import { RegisterForm } from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="stack" style={{ maxWidth: 520, margin: "40px auto" }}>
      <h1>注册</h1>
      <RegisterForm />
      <Link className="muted" href="/login">已有账号？去登录</Link>
    </div>
  );
}
