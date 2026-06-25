export function makeQrCodeUrl(copyCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/book-copy/${encodeURIComponent(copyCode)}`;
}
