import { z } from "zod";
import { createAuditLog } from "@/lib/audit";
import { fail, ok } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/auth";
import { generateCopyCode } from "@/lib/copyCode";
import { prisma } from "@/lib/db";
import { makeQrCodeUrl } from "@/lib/qrcode";
import { SOURCE_TYPES } from "@/lib/constants";

const schema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  publisher: z.string().optional(),
  category: z.string().optional(),
  isbn: z.string().optional(),
  description: z.string().optional(),
  sourceType: z.enum(SOURCE_TYPES).default("ORIGINAL"),
  location: z.string().optional(),
  quantity: z.coerce.number().int().min(0).max(200).default(1),
});

export async function GET() {
  try {
    await requireAdmin();
    const books = await prisma.book.findMany({
      include: { copies: true },
      orderBy: { id: "desc" },
    });
    return ok(
      books.map((book) => ({
        ...book,
        totalCopies: book.copies.length,
        availableCopies: book.copies.filter((copy) => copy.status === "AVAILABLE").length,
        borrowedCopies: book.copies.filter((copy) => copy.status === "BORROWED").length,
      })),
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "无权限", 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("请检查书目信息", 422);

    const book = await prisma.$transaction(async (tx) => {
      const created = await tx.book.create({
        data: {
          title: parsed.data.title,
          author: parsed.data.author || null,
          publisher: parsed.data.publisher || null,
          category: parsed.data.category || "OTHER",
          isbn: parsed.data.isbn || null,
          description: parsed.data.description || null,
          sourceType: parsed.data.sourceType,
        },
      });

      for (let i = 1; i <= parsed.data.quantity; i += 1) {
        const copyCode = generateCopyCode(created.category, created.id, i);
        await tx.bookCopy.create({
          data: {
            bookId: created.id,
            copyCode,
            location: parsed.data.location || null,
            qrCodeUrl: makeQrCodeUrl(copyCode),
          },
        });
      }

      await createAuditLog(
        {
          userId: admin.id,
          action: "CREATE_BOOK",
          targetType: "Book",
          targetId: String(created.id),
          detail: `新增书目 ${created.title}`,
        },
        tx,
      );
      return created;
    });

    return ok(book, "新增书目成功");
  } catch (error) {
    return fail(error instanceof Error ? error.message : "新增书目失败", 400);
  }
}
