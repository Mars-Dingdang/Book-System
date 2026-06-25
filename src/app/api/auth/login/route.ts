import { z } from "zod";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

const schema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("请输入学号和密码", 422);

  const user = await prisma.user.findUnique({ where: { studentId: parsed.data.studentId } });
  if (!user || !user.isActive) return fail("学号或密码错误", 401);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("学号或密码错误", 401);

  setSessionCookie(createSessionToken(user));
  return ok({ id: user.id, name: user.name, role: user.role }, "登录成功");
}
