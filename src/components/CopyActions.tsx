"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CopyStatus } from "@/lib/constants";

export default function CopyActions({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status as CopyStatus);

  async function update(nextStatus: CopyStatus) {
    setValue(nextStatus);
    await fetch("/api/admin/book-copies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    router.refresh();
  }

  return (
    <select value={value} onChange={(event) => update(event.target.value as CopyStatus)}>
      <option value="AVAILABLE">可借</option>
      <option value="BORROWED">已借出</option>
      <option value="DAMAGED">损坏</option>
      <option value="LOST">丢失</option>
    </select>
  );
}
