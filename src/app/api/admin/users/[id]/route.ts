import { z } from "zod";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  username: z.string().min(1).optional().or(z.literal("")),
  studentId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  className: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  await requireAdmin();
  const id = Number(params.id);
  if (!Number.isInteger(id)) return fail("用户不存在", 404);

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return fail("请检查用户信息", 422);

  const data = parsed.data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.username ? { username: data.username.toUpperCase() } : {}),
      ...(data.studentId ? { studentId: data.studentId } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.className !== undefined ? { className: data.className || null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
      ...(data.email !== undefined ? { email: data.email || null } : {}),
      ...(data.approvalStatus ? { approvalStatus: data.approvalStatus } : {}),
      ...(data.approvalStatus && data.isActive === undefined ? { isActive: data.approvalStatus === "APPROVED" } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
    },
    select: { id: true, username: true, studentId: true, name: true, isActive: true, approvalStatus: true },
  });

  return ok(user, "用户信息已更新");
}
