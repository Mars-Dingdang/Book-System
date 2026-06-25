import { requireAdmin } from "@/lib/auth";
import { fail } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdmin();
    const records = await prisma.borrowRecord.findMany({
      include: { user: true, bookCopy: { include: { book: true } } },
      orderBy: { borrowedAt: "desc" },
    });
    const rows = [
      ["studentId", "name", "title", "copyCode", "borrowedAt", "dueAt", "returnedAt", "status"],
      ...records.map((record) => [
        record.user.studentId,
        record.user.name,
        record.bookCopy.book.title,
        record.bookCopy.copyCode,
        record.borrowedAt.toISOString(),
        record.dueAt?.toISOString(),
        record.returnedAt?.toISOString(),
        record.status,
      ]),
    ];
    return new Response(rows.map((row) => row.map(csvCell).join(",")).join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="borrow-records.csv"',
      },
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "无权限", 403);
  }
}
