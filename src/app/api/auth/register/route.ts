import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { fail, ok } from "@/lib/apiResponse";

const schema = z.object({
  name: z.string().min(1),
  studentId: z.string().min(1),
  className: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return fail("请检查注册信息", 422);

  const exists = await prisma.user.findUnique({ where: { studentId: parsed.data.studentId } });
  if (exists) return fail("学号已注册", 409);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      studentId: parsed.data.studentId,
      className: parsed.data.className,
      email: parsed.data.email || null,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  setSessionCookie(createSessionToken(user));
  return ok({ id: user.id, name: user.name, role: user.role }, "注册成功");
}
