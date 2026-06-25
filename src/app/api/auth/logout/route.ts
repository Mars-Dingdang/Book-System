import { clearSessionCookie } from "@/lib/auth";
import { ok } from "@/lib/apiResponse";

export async function POST() {
  clearSessionCookie();
  return ok({}, "已退出");
}
