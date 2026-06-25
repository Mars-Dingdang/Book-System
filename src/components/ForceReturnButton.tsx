"use client";

import { useRouter } from "next/navigation";

export default function ForceReturnButton({ id }: { id: number }) {
  const router = useRouter();

  async function submit() {
    await fetch(`/api/admin/borrow-records/${id}/force-return`, { method: "POST" });
    router.refresh();
  }

  return (
    <button className="secondary" onClick={submit} type="button">
      强制归还
    </button>
  );
}
