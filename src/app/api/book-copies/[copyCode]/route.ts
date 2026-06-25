import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/apiResponse";
import { parseCopyCodeFromQrText } from "@/lib/copyCode";

export async function GET(_: Request, { params }: { params: { copyCode: string } }) {
  const copyCode = parseCopyCodeFromQrText(decodeURIComponent(params.copyCode));
  const copy = await prisma.bookCopy.findUnique({
    where: { copyCode },
    include: {
      book: true,
      borrowRecords: {
        where: { returnedAt: null },
        include: { user: { select: { id: true, name: true, studentId: true } } },
        orderBy: { borrowedAt: "desc" },
      },
    },
  });
  if (!copy) return fail("实体书不存在", 404);
  return ok(copy);
}
