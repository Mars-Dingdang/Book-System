import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";
import { generateCopyCode } from "@/lib/copyCode";
import { prisma } from "@/lib/db";
import { makeQrCodeUrl } from "@/lib/qrcode";
import { COPY_STATUSES, type CopyStatus } from "@/lib/constants";

const createSchema = z.object({
  bookId: z.coerce.number().int().positive(),
  location: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
});

const patchSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(COPY_STATUSES).optional(),
  location: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CopyStatus | null;
    const copies = await prisma.bookCopy.findMany({
      where: status ? { status } : {},
      include: { book: true },
      orderBy: { copyCode: "asc" },
    });
    return ok(copies);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "无权限", 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return fail("请检查实体书信息", 422);

    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({ where: { id: parsed.data.bookId }, include: { copies: true } });
      if (!book) throw new Error("书目不存在");
      const created = [];
      const start = book.copies.length + 1;
      for (let i = 0; i < parsed.data.quantity; i += 1) {
        const copyCode = generateCopyCode(book.category, book.id, start + i);
        created.push(
          await tx.bookCopy.create({
            data: {
              bookId: book.id,
              copyCode,
              location: parsed.data.location || null,
              qrCodeUrl: makeQrCodeUrl(copyCode),
            },
          }),
        );
      }
      await createAuditLog(
        {
          userId: admin.id,
          action: "CREATE_BOOK_COPY",
          targetType: "Book",
          targetId: String(book.id),
          detail: `新增 ${created.length} 本实体书`,
        },
        tx,
      );
      return created;
    });

    return ok(result, "新增实体书成功");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "新增实体书失败", 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) return fail("请检查实体书信息", 422);

    const copy = await prisma.$transaction(async (tx) => {
      const updated = await tx.bookCopy.update({
        where: { id: parsed.data.id },
        data: {
          status: parsed.data.status,
          location: parsed.data.location,
        },
      });
      await createAuditLog(
        {
          userId: admin.id,
          action: "UPDATE_BOOK_COPY",
          targetType: "BookCopy",
          targetId: updated.copyCode,
          detail: `修改实体书状态或位置`,
        },
        tx,
      );
      return updated;
    });

    return ok(copy, "实体书已更新");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "更新实体书失败", 400);
  }
}
