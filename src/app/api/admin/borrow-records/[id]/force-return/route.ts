import { createAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const id = Number(params.id);
    if (!Number.isInteger(id)) return fail("借阅记录不存在", 404);

    await prisma.$transaction(async (tx) => {
      const record = await tx.borrowRecord.findUnique({ where: { id }, include: { bookCopy: true } });
      if (!record) throw new Error("借阅记录不存在");
      if (record.returnedAt) throw new Error("这本书已经归还");

      await tx.borrowRecord.update({
        where: { id },
        data: { returnedAt: new Date(), status: "RETURNED" },
      });
      await tx.bookCopy.update({
        where: { id: record.bookCopyId },
        data: { status: "AVAILABLE" },
      });
      await createAuditLog(
        {
          userId: admin.id,
          action: "FORCE_RETURN_BOOK",
          targetType: "BookCopy",
          targetId: record.bookCopy.copyCode,
          detail: `管理员强制归还 ${record.bookCopy.copyCode}`,
        },
        tx,
      );
    });

    return ok({}, "强制归还成功");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "强制归还失败", 400);
  }
}
