import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";

const schema = z.object({
  username: z.string().regex(/^B202\d{1}000\d{3}$/i, "统一编号格式不正确"),
  name: z.string().min(1),
  studentId: z.string().regex(/^\d{6}$/, "学号格式不正确"),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("请检查注册信息", 422);

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username.toUpperCase() }, { studentId: parsed.data.studentId }] },
  });
  if (exists) return fail("统一编号或学号已注册", 409);

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username.toUpperCase(),
      name: parsed.data.name,
      studentId: parsed.data.studentId,
      passwordHash: await hashPassword(parsed.data.password),
      isActive: false,
      approvalStatus: "PENDING",
    },
  });

  return ok({ id: user.id, name: user.name, approvalStatus: user.approvalStatus }, "注册申请已提交，请等待管理员审核");
}
