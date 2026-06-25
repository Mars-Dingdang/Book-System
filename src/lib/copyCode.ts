export function generateCopyCode(category: string | null | undefined, bookId: number, copyIndex: number): string {
  const safeCategory = (category || "OTHER").toUpperCase().replace(/[^A-Z0-9]/g, "") || "OTHER";
  const bookPart = String(bookId).padStart(3, "0");
  const copyPart = String(copyIndex).padStart(2, "0");
  return `CHEM-${safeCategory}-${bookPart}-${copyPart}`;
}

export function parseCopyCodeFromQrText(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/CHEM-[A-Z0-9]+-\d{3,}-\d{2,}/i);
  return (match?.[0] || trimmed).toUpperCase();
}
