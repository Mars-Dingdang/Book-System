import { requireAdmin } from "@/lib/auth";
import { fail } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdmin();
    const copies = await prisma.bookCopy.findMany({ include: { book: true }, orderBy: { copyCode: "asc" } });
    const rows = [
      ["title", "author", "category", "copyCode", "status", "location"],
      ...copies.map((copy) => [copy.book.title, copy.book.author, copy.book.category, copy.copyCode, copy.status, copy.location]),
    ];
    return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="books.csv"',
      },
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "无权限", 403);
  }
}
