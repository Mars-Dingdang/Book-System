import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import type { Role } from "./constants";
import { prisma } from "./db";

const COOKIE_NAME = "chem_library_session";

type SessionPayload = {
  userId: number;
  role: Role;
};

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-secret-change-me";
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(user: Pick<User, "id" | "role">) {
  return jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), { expiresIn: "7d" });
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as SessionPayload;
    return prisma.user.findFirst({
      where: { id: payload.userId, isActive: true, approvalStatus: "APPROVED" },
      select: { id: true, username: true, name: true, studentId: true, className: true, phone: true, email: true, role: true, isActive: true, approvalStatus: true },
    });
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error("未登录");
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("无权限");
  return user;
}

export async function requirePageAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePageAdmin() {
  const user = await requirePageAuth();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}
