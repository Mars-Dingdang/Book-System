"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProfileFormProps = {
  user: {
    username: string | null;
    name: string;
    studentId: string;
    className: string | null;
    phone: string | null;
    email: string | null;
  };
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        className: form.get("className"),
        phone: form.get("phone"),
        email: form.get("email"),
      }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    router.refresh();
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setError("两次输入的新密码不一致");
      return;
    }
    const res = await fetch("/api/me/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    event.currentTarget.reset();
  }

  return (
    <div className="profile-layout">
      <form className="panel stack" onSubmit={saveProfile}>
        <h2>个人信息</h2>
        {error ? <div className="message error">{error}</div> : null}
        {message ? <div className="message">{message}</div> : null}
        <label>统一编号<input value={user.username || "待管理员补充"} disabled /></label>
        <label>学号<input value={user.studentId} disabled /></label>
        <label>姓名<input value={user.name} disabled /></label>
        <label>班级<input name="className" defaultValue={user.className || ""} /></label>
        <label>电话<input name="phone" defaultValue={user.phone || ""} /></label>
        <label>邮箱<input name="email" type="email" defaultValue={user.email || ""} /></label>
        <button type="submit">保存个人信息</button>
      </form>

      <form className="panel stack" onSubmit={changePassword}>
        <h2>修改密码</h2>
        <label>当前密码<input name="currentPassword" type="password" required /></label>
        <label>新密码<input name="newPassword" type="password" minLength={6} required /></label>
        <label>确认新密码<input name="confirmPassword" type="password" minLength={6} required /></label>
        <button type="submit">更新密码</button>
      </form>
    </div>
  );
}
