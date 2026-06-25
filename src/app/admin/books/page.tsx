import Link from "next/link";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminBooksPage() {
  await requirePageAdmin();
  const books = await prisma.book.findMany({ include: { copies: true }, orderBy: { id: "desc" } });

  return (
    <div className="stack">
      <div className="row">
        <h1>书目管理</h1>
        <Link className="button" href="/admin/books/new">新增书目</Link>
      </div>
      <table>
        <thead><tr><th>书名</th><th>作者</th><th>分类</th><th>总数</th><th>可借</th></tr></thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <td><Link href={`/books/${book.id}`}>{book.title}</Link></td>
              <td>{book.author || "-"}</td>
              <td>{book.category || "-"}</td>
              <td>{book.copies.length}</td>
              <td>{book.copies.filter((copy) => copy.status === "AVAILABLE").length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
