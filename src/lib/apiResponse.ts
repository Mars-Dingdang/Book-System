import { NextResponse } from "next/server";

export function ok<T>(data: T, message = "操作成功") {
  return NextResponse.json({ success: true, message, data });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}
