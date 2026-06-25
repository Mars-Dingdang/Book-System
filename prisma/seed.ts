import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generateCopyCode } from "../src/lib/copyCode";
import { makeQrCodeUrl } from "../src/lib/qrcode";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_INIT_PASSWORD || "admin123456";
  const userHash = await bcrypt.hash("123456", 10);
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { studentId: "admin" },
    update: { passwordHash: adminHash, role: "ADMIN", isActive: true, approvalStatus: "APPROVED" },
    create: {
      username: "admin",
      name: "管理员",
      studentId: "admin",
      className: "化学竞赛教室",
      passwordHash: adminHash,
      role: "ADMIN",
      approvalStatus: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: { studentId: "250851" },
    update: {},
    create: {
      username: "B2025000001",
      name: "张三",
      studentId: "250851",
      className: "高二竞赛班",
      email: "zhangsan@example.com",
      passwordHash: userHash,
      role: "USER",
      approvalStatus: "APPROVED",
    },
  });

  const existing = await prisma.book.findFirst({ where: { title: "高中化学竞赛教程" } });
  if (!existing) {
    const book = await prisma.book.create({
      data: {
        title: "高中化学竞赛教程",
        author: "示例作者",
        publisher: "示例出版社",
        category: "GEN",
        sourceType: "ORIGINAL",
        description: "系统初始化示例书目。",
      },
    });

    for (let i = 1; i <= 3; i += 1) {
      const copyCode = generateCopyCode(book.category, book.id, i);
      await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          copyCode,
          location: "A柜第1层",
          qrCodeUrl: makeQrCodeUrl(copyCode),
        },
      });
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
