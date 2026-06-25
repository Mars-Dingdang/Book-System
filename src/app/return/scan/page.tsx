import ScanAction from "@/components/ScanAction";
import { requirePageAuth } from "@/lib/auth";

export default async function ReturnScanPage() {
  await requirePageAuth();
  return (
    <div className="stack">
      <h1>扫码还书</h1>
      <ScanAction mode="return" />
    </div>
  );
}
