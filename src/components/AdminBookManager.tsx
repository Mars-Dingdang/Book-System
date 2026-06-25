"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type BookRow = {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
  category: string | null;
  isbn: string | null;
  description: string | null;
  sourceType: string;
  totalCopies: number;
  availableCopies: number;
};

function parseBookRows(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, author = "", publisher = "", category = "OTHER", isbn = "", location = "", quantity = "1"] = line.split(/[\t,，]/).map((item) => item.trim());
      return { title, author, publisher, category, isbn, location, quantity: Number(quantity) || 1, sourceType: "ORIGINAL" };
    });
}

export default function AdminBookManager({ books }: { books: BookRow[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveBook(event: React.FormEvent<HTMLFormElement>, book: BookRow) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    router.refresh();
  }

  async function deleteBook(book: BookRow) {
    if (!window.confirm(`确定删除书目“${book.title}”吗？会一并删除其未被借阅过的实体书。`)) return;
    setMessage("");
    setError("");
    const res = await fetch(`/api/admin/books/${book.id}`, { method: "DELETE" });
    const body = await res.json();
    if (!body.success) {
      setError(body.message);
      return;
    }
    setMessage(body.message);
    router.refresh();
  }

  async function importBooks(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    const form = new FormData(event.currentTarget);
    const rows = parseBookRows(String(form.get("rows") || ""));
    const res = await fetch("/api/admin/books", {
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

      <form className="panel stack" onSubmit={importBooks}>
        <h2>批量导入书目</h2>
        <textarea name="rows" rows={5} placeholder={"每行一个书目：书名,作者,出版社,分类,ISBN,位置,数量\n高中化学竞赛教程,张三,化学出版社,GEN,9780000000000,A柜第1层,3"} required />
        <button type="submit">批量导入</button>
      </form>

      <div className="book-editor-list">
        {books.map((book) => (
          <form className="panel book-editor" key={book.id} onSubmit={(event) => saveBook(event, book)}>
            <label>书名<input name="title" defaultValue={book.title} required /></label>
            <label>作者<input name="author" defaultValue={book.author || ""} /></label>
            <label>出版社<input name="publisher" defaultValue={book.publisher || ""} /></label>
            <label>分类<input name="category" defaultValue={book.category || "OTHER"} /></label>
            <label>ISBN<input name="isbn" defaultValue={book.isbn || ""} /></label>
            <label>资料类型
              <select name="sourceType" defaultValue={book.sourceType}>
                <option>ORIGINAL</option>
                <option>PHOTOCOPY</option>
                <option>HANDOUT</option>
                <option>INTERNAL</option>
                <option>OTHER</option>
              </select>
            </label>
            <label className="book-description">描述<textarea name="description" rows={2} defaultValue={book.description || ""} /></label>
            <div className="book-stats">
              <Link href={`/books/${book.id}`}>查看</Link>
              <span>{book.totalCopies} 本</span>
              <span>{book.availableCopies} 本可借</span>
            </div>
            <div className="row editor-actions">
              <button type="submit">保存</button>
              <button className="danger" type="button" onClick={() => deleteBook(book)}>删除</button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
