import ScanAction from "@/components/ScanAction";
import { requirePageAuth } from "@/lib/auth";

export default async function BorrowScanPage() {
  await requirePageAuth();
  return (
    <div className="stack">
      <h1>扫码借书</h1>
      <ScanAction mode="borrow" />
    </div>
  );
}
