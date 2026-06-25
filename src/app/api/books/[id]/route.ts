import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/apiResponse";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return fail("未登录", 401);

  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail("书目不存在", 404);

  const book = await prisma.book.findUnique({
    where: { id },
    include: { copies: { orderBy: { copyCode: "asc" } } },
  });
  if (!book) return fail("书目不存在", 404);

  return ok(book);
}
