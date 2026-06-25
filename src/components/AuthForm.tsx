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
      body: JSON.stringify({ studentId: form.get("studentId"), password: form.get("password") }),
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
      <label>学号<input name="studentId" required /></label>
      <label>密码<input name="password" required type="password" /></label>
      <button type="submit">登录</button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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
        studentId: form.get("studentId"),
        className: form.get("className"),
        email: form.get("email"),
        password: form.get("password"),
      }),
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
      <label>姓名<input name="name" required /></label>
      <label>学号<input name="studentId" required /></label>
      <label>班级<input name="className" /></label>
      <label>邮箱<input name="email" type="email" /></label>
      <label>密码<input name="password" required type="password" minLength={6} /></label>
      <label>确认密码<input name="confirmPassword" required type="password" minLength={6} /></label>
      <button type="submit">注册</button>
    </form>
  );
}
