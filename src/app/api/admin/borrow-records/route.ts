import { fail, ok } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { BorrowStatus } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as BorrowStatus | null;
    const onlyActive = searchParams.get("active") === "1";
    const records = await prisma.borrowRecord.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(onlyActive ? { returnedAt: null } : {}),
      },
      include: {
        user: { select: { id: true, name: true, studentId: true, className: true } },
        bookCopy: { include: { book: true } },
      },
      orderBy: { borrowedAt: "desc" },
    });
    return ok(records);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "无权限", 403);
  }
}
