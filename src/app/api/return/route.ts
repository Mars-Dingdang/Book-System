import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { requireAuth } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { parseCopyCodeFromQrText } from "@/lib/copyCode";
import { prisma } from "@/lib/db";

const schema = z.object({ copyCode: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("请输入实体书编号", 422);
    const copyCode = parseCopyCodeFromQrText(parsed.data.copyCode);

    await prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.findUnique({ where: { copyCode } });
      if (!copy) throw new Error("实体书不存在");

      const record = await tx.borrowRecord.findFirst({
        where: { bookCopyId: copy.id, returnedAt: null, status: "BORROWED" },
      });
      if (!record) throw new Error("这本书当前没有未归还记录");
      if (user.role !== "ADMIN" && record.userId !== user.id) throw new Error("这本书不是由你借出的，请联系管理员");

      await tx.borrowRecord.update({
        where: { id: record.id },
        data: { returnedAt: new Date(), status: "RETURNED" },
      });

      await tx.bookCopy.update({
        where: { id: copy.id },
        data: { status: "AVAILABLE" },
      });

      await createAuditLog(
        {
          userId: user.id,
          action: user.role === "ADMIN" && record.userId !== user.id ? "FORCE_RETURN_BOOK" : "RETURN_BOOK",
          targetType: "BookCopy",
          targetId: copy.copyCode,
          detail: `归还实体书 ${copy.copyCode}`,
        },
        tx,
      );
    });

    return ok({}, "归还成功");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "归还失败", error instanceof Error && error.message === "未登录" ? 401 : 400);
  }
}
