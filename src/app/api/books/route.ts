import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/apiResponse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  const where: Prisma.BookWhereInput = {
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
  };

  const books = await prisma.book.findMany({
    where,
    orderBy: { id: "desc" },
    include: { copies: true },
  });

  const items = books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    totalCopies: book.copies.length,
    availableCopies: book.copies.filter((copy) => copy.status === "AVAILABLE").length,
    borrowedCopies: book.copies.filter((copy) => copy.status === "BORROWED").length,
  }));

  return ok({ items, total: items.length });
}
