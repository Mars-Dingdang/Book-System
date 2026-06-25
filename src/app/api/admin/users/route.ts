import { z } from "zod";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

const userSchema = z.object({
  username: z.string().regex(/^B202\d{1}000\d{3}$/i),
  studentId: z.string().regex(/^\d{6}$/),
  name: z.string().min(1),
  className: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

const bulkSchema = z.object({
  rows: z.array(userSchema.extend({ password: z.string().min(6).optional().or(z.literal("")) })).min(1),
});

export async function GET() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      username: true,
      studentId: true,
      name: true,
      className: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      approvalStatus: true,
      createdAt: true,
    },
  });
  return ok(users);
}

export async function POST(request: Request) {
  await requireAdmin();
  const parsed = bulkSchema.safeParse(await request.json());
  if (!parsed.success) return fail("请检查导入用户数据", 422);

  const result = { created: 0, skipped: 0 };
  for (const row of parsed.data.rows) {
    const username = row.username.toUpperCase();
    const exists = await prisma.user.findFirst({ where: { OR: [{ username }, { studentId: row.studentId }] } });
    if (exists) {
      result.skipped += 1;
      continue;
    }
    await prisma.user.create({
      data: {
        username,
        studentId: row.studentId,
        name: row.name,
        className: row.className || null,
        phone: row.phone || null,
        email: row.email || null,
        passwordHash: await hashPassword(row.password || "123456"),
        role: "USER",
        isActive: row.isActive ?? true,
        approvalStatus: row.approvalStatus || "APPROVED",
      },
    });
    result.created += 1;
  }

  return ok(result, `已导入 ${result.created} 个用户，跳过 ${result.skipped} 个重复用户`);
}
