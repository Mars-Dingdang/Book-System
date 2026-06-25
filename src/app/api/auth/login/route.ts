import { z } from "zod";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";
import { prisma } from "@/lib/db";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("请输入统一编号和密码", 422);

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: parsed.data.username.toUpperCase() }, { studentId: parsed.data.username }] },
  });
  if (!user) return fail("统一编号或密码错误", 401);
  if (user.approvalStatus === "PENDING") return fail("账号正在等待管理员审核", 403);
  if (user.approvalStatus === "REJECTED" || !user.isActive) return fail("账号不可用，请联系管理员", 403);

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("统一编号或密码错误", 401);

  setSessionCookie(createSessionToken(user));
  return ok({ id: user.id, name: user.name, role: user.role }, "登录成功");
}
