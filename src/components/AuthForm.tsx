"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      {error ? <div className="message error">{error}</div> : null}
      <label>统一编号<input name="username" required placeholder="B202x000xxx" /></label>
      <label>密码<input name="password" required type="password" /></label>
      <button type="submit">登录</button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("两次输入的密码不一致");
      return;
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        username: form.get("username"),
        studentId: form.get("studentId"),
        password: form.get("password"),
      }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message || "注册申请已提交，请等待管理员审核");
    router.refresh();
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message">{message}</div> : null}
      <label>统一编号<input name="username" required placeholder="B202x000xxx" pattern="B202[0-9]000[0-9]{3}" /></label>
      <label>学号<input name="studentId" required placeholder="250851" pattern="[0-9]{6}" /></label>
      <label>姓名<input name="name" required /></label>
      <label>密码<input name="password" required type="password" minLength={6} /></label>
      <label>确认密码<input name="confirmPassword" required type="password" minLength={6} /></label>
      <button type="submit">注册</button>
    </form>
  );
}
