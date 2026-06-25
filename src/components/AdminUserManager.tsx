"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: number;
  username: string | null;
  studentId: string;
  name: string;
  className: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  approvalStatus: string;
};

type Props = {
  users: AdminUser[];
};

function parseBulkRows(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [username, studentId, name, password = "123456"] = line.split(/[\t,，\s]+/);
      return { username, studentId, name, password };
    });
}

export default function AdminUserManager({ users }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pendingUsers = users.filter((user) => user.approvalStatus === "PENDING");

  async function updateUser(id: number, payload: Record<string, unknown>) {
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    router.refresh();
  }

  async function saveUser(event: React.FormEvent<HTMLFormElement>, user: AdminUser) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      name: form.get("name"),
      className: form.get("className"),
      phone: form.get("phone"),
      email: form.get("email"),
      password: form.get("password"),
    };
    if (form.has("username")) payload.username = form.get("username");
    if (form.has("studentId")) payload.studentId = form.get("studentId");
    if (user.role !== "ADMIN") {
      payload.approvalStatus = form.get("approvalStatus");
      payload.isActive = form.get("isActive") === "on";
    }
    await updateUser(user.id, payload);
  }

  async function importUsers(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const rows = parseBulkRows(String(form.get("rows") || ""));
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <div className="stack">
      {error ? <div className="message error">{error}</div> : null}
      {message ? <div className="message">{message}</div> : null}

      <section className="panel stack">
        <div className="row">
          <h2>待注册账号</h2>
          <span className="badge">{pendingUsers.length} 个待审核</span>
        </div>
        <div className="user-list compact-list">
          {pendingUsers.length === 0 ? <p className="muted">暂无待审核账号</p> : null}
          {pendingUsers.map((user) => (
            <div className="user-row" key={user.id}>
              <div>
                <strong>{user.name}</strong>
                <p className="muted">{user.username || "未设置统一编号"} · 学号 {user.studentId}</p>
              </div>
              <div className="row">
                <button type="button" onClick={() => updateUser(user.id, { approvalStatus: "APPROVED" })}>通过</button>
                <button className="secondary" type="button" onClick={() => updateUser(user.id, { approvalStatus: "REJECTED", isActive: false })}>拒绝</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <form className="panel stack" onSubmit={importUsers}>
        <h2>批量添加用户</h2>
        <textarea name="rows" rows={5} placeholder={"每行一个用户：统一编号 学号 姓名 初始密码\nB2025000002 250852 李四 123456"} required />
        <button type="submit">批量导入</button>
      </form>

      <section className="stack">
        <h2>用户列表</h2>
        <div className="user-list">
          {users.map((user) => (
            <form className="panel user-editor" key={user.id} onSubmit={(event) => saveUser(event, user)}>
              <label>统一编号<input name="username" defaultValue={user.username || ""} disabled={user.role === "ADMIN"} /></label>
              <label>学号<input name="studentId" defaultValue={user.studentId} disabled={user.role === "ADMIN"} /></label>
              <label>姓名<input name="name" defaultValue={user.name} /></label>
              <label>班级<input name="className" defaultValue={user.className || ""} /></label>
              <label>电话<input name="phone" defaultValue={user.phone || ""} /></label>
              <label>邮箱<input name="email" type="email" defaultValue={user.email || ""} /></label>
              <label>状态
                <select name="approvalStatus" defaultValue={user.approvalStatus} disabled={user.role === "ADMIN"}>
                  <option value="PENDING">待审核</option>
                  <option value="APPROVED">已通过</option>
                  <option value="REJECTED">已拒绝</option>
                </select>
              </label>
              <label>重置密码<input name="password" type="password" minLength={6} placeholder="留空则不修改" /></label>
              <label className="inline-check"><input name="isActive" type="checkbox" defaultChecked={user.isActive} disabled={user.role === "ADMIN"} /> 启用账号</label>
              <button type="submit">保存</button>
            </form>
          ))}
        </div>
      </section>
    </div>
  );
}
