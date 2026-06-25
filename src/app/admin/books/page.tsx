import Link from "next/link";
import AdminBookManager from "@/components/AdminBookManager";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

type BookWithCopies = {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
  category: string | null;
  isbn: string | null;
  description: string | null;
  sourceType: string;
  copies: { status: string }[];
};

export default async function AdminBooksPage() {
  await requirePageAdmin();
  const books = await prisma.book.findMany({ include: { copies: true }, orderBy: { id: "desc" } });
  const rows = books.map((book: BookWithCopies) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    category: book.category,
    isbn: book.isbn,
    description: book.description,
    sourceType: book.sourceType,
    totalCopies: book.copies.length,
    availableCopies: book.copies.filter((copy: { status: string }) => copy.status === "AVAILABLE").length,
  }));

  return (
    <div className="stack">
      <div className="row">
        <h1>书目管理</h1>
        <Link className="button" href="/admin/books/new">新增书目</Link>
      </div>
      <AdminBookManager books={rows} />
    </div>
  );
}
