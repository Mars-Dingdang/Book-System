import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SOURCE_TYPES } from "@/lib/constants";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().optional().or(z.literal("")),
  publisher: z.string().optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  isbn: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  sourceType: z.enum(SOURCE_TYPES).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail("书目不存在", 404);

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return fail("请检查书目信息", 422);

  const data = parsed.data;
  const book = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.book.update({
      where: { id },
      data: {
        ...(data.title ? { title: data.title } : {}),
        ...(data.author !== undefined ? { author: data.author || null } : {}),
        ...(data.publisher !== undefined ? { publisher: data.publisher || null } : {}),
        ...(data.category !== undefined ? { category: data.category || "OTHER" } : {}),
        ...(data.isbn !== undefined ? { isbn: data.isbn || null } : {}),
        ...(data.description !== undefined ? { description: data.description || null } : {}),
        ...(data.sourceType ? { sourceType: data.sourceType } : {}),
      },
    });
    await createAuditLog(
      {
        userId: admin.id,
        action: "UPDATE_BOOK",
        targetType: "Book",
        targetId: String(updated.id),
        detail: `更新书目 ${updated.title}`,
      },
      tx,
    );
    return updated;
  });

  return ok(book, "书目信息已更新");
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail("书目不存在", 404);

  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      copies: {
        select: {
          status: true,
          borrowRecords: { select: { id: true }, take: 1 },
        },
      },
    },
  });
  if (!book) return fail("书目不存在", 404);
  if (book.copies.some((copy: { status: string }) => copy.status === "BORROWED")) return fail("该书目仍有实体书借出，不能删除", 400);
  if (book.copies.some((copy: { borrowRecords: unknown[] }) => copy.borrowRecords.length > 0)) return fail("该书目已有借阅记录，不能删除", 400);

  await prisma.$transaction(async (tx: any) => {
    await tx.book.delete({ where: { id } });
    await createAuditLog(
      {
        userId: admin.id,
        action: "DELETE_BOOK",
        targetType: "Book",
        targetId: String(book.id),
        detail: `删除书目 ${book.title}`,
      },
      tx,
    );
  });

  return ok({ id }, "书目已删除");
}
