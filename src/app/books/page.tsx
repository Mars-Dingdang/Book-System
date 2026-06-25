import BookCard from "@/components/BookCard";
import { prisma } from "@/lib/db";

export default async function BooksPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = searchParams.q?.trim();
  const category = searchParams.category?.trim();
  const books = await prisma.book.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { author: { contains: q } },
              { publisher: { contains: q } },
              { isbn: { contains: q } },
              { description: { contains: q } },
              { copies: { some: { copyCode: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: { copies: true },
    orderBy: { id: "desc" },
  });

  return (
    <div className="stack">
      <h1>图书列表</h1>
      <form className="row">
        <input name="q" placeholder="搜索书名、作者、编号" defaultValue={q} />
        <input name="category" placeholder="分类" defaultValue={category} />
        <button type="submit">搜索</button>
      </form>
      <div className="grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            id={book.id}
            title={book.title}
            author={book.author}
            category={book.category}
            totalCopies={book.copies.length}
            availableCopies={book.copies.filter((copy) => copy.status === "AVAILABLE").length}
          />
        ))}
      </div>
    </div>
  );
}
