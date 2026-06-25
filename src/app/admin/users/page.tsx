import AdminUserManager from "@/components/AdminUserManager";
import { requirePageAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminUsersPage() {
  await requirePageAdmin();
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
    },
  });

  return (
    <div className="stack">
      <h1>用户管理</h1>
      <AdminUserManager users={users} />
    </div>
  );
}
