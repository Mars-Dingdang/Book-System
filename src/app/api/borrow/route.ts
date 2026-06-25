import { addDays } from "date-fns";
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

    const record = await prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.findUnique({ where: { copyCode } });
      if (!copy) throw new Error("实体书不存在");
      if (copy.status !== "AVAILABLE") throw new Error("这本书当前不可借");

      const updated = await tx.bookCopy.updateMany({
        where: { id: copy.id, status: "AVAILABLE" },
        data: { status: "BORROWED" },
      });
      if (updated.count !== 1) throw new Error("这本书已被借走");

      const created = await tx.borrowRecord.create({
        data: {
          userId: user.id,
          bookCopyId: copy.id,
          borrowedAt: new Date(),
          dueAt: addDays(new Date(), 30),
          status: "BORROWED",
        },
      });

      await createAuditLog(
        {
          userId: user.id,
          action: "BORROW_BOOK",
          targetType: "BookCopy",
          targetId: copy.copyCode,
          detail: `用户借出实体书 ${copy.copyCode}`,
        },
        tx,
      );

      return created;
    });

    return ok({ record }, "借阅成功");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "借阅失败", error instanceof Error && error.message === "未登录" ? 401 : 400);
  }
}
