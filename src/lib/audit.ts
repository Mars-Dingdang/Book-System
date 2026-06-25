import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./db";

type Client = PrismaClient | Prisma.TransactionClient;

export async function createAuditLog(
  data: { userId?: number; action: string; targetType?: string; targetId?: string; detail?: string },
  client: Client = prisma,
) {
  return client.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      detail: data.detail,
    },
  });
}
