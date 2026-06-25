import AdminBookForm from "@/components/AdminBookForm";
import { requirePageAdmin } from "@/lib/auth";

export default async function NewBookPage() {
  await requirePageAdmin();
  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <h1>新增书目</h1>
      <AdminBookForm />
    </div>
  );
}
