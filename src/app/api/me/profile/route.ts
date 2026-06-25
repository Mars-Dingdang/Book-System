import { z } from "zod";
import { hashPassword, requireAuth, verifyPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

const profileSchema = z.object({
  className: z.string().max(40).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

export async function PATCH(request: Request) {
  const user = await requireAuth();
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return fail("请检查个人信息", 422);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      className: parsed.data.className || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
    },
    select: { id: true, username: true, name: true, studentId: true, className: true, phone: true, email: true },
  });

  return ok(updated, "个人信息已更新");
}

export async function POST(request: Request) {
  const user = await requireAuth();
  const parsed = passwordSchema.safeParse(await request.json());
  if (!parsed.success) return fail("新密码至少需要 6 位", 422);

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) return fail("用户不存在", 404);

  const valid = await verifyPassword(parsed.data.currentPassword, fullUser.passwordHash);
  if (!valid) return fail("当前密码不正确", 403);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  return ok(null, "密码已修改");
}
