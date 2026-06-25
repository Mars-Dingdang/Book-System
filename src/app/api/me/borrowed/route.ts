import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const records = await prisma.borrowRecord.findMany({
      where: { userId: user.id, returnedAt: null, status: "BORROWED" },
      include: { bookCopy: { include: { book: true } } },
      orderBy: { borrowedAt: "desc" },
    });
    return ok(records);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "未登录", 401);
  }
}
