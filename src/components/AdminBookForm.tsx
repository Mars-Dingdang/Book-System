"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminBookForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/admin/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const body = await res.json();
    setMessage(body.message);
    if (body.success) {
      router.push("/admin/books");
      router.refresh();
    }
  }

  return (
    <form className="panel stack" onSubmit={submit}>
      {message ? <div className="message">{message}</div> : null}
      <label>书名<input name="title" required /></label>
      <label>作者<input name="author" /></label>
      <label>出版社<input name="publisher" /></label>
      <label>分类<input name="category" placeholder="ORG / INORG / GEN / OTHER" /></label>
      <label>ISBN<input name="isbn" /></label>
      <label>资料类型<select name="sourceType" defaultValue="ORIGINAL"><option>ORIGINAL</option><option>PHOTOCOPY</option><option>HANDOUT</option><option>INTERNAL</option><option>OTHER</option></select></label>
      <label>所在位置<input name="location" /></label>
      <label>初始副本数量<input name="quantity" type="number" min="0" max="200" defaultValue="1" /></label>
      <label>描述<textarea name="description" rows={4} /></label>
      <button type="submit">保存书目</button>
    </form>
  );
}
