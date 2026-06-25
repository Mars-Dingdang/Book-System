const statusText: Record<string, string> = {
  AVAILABLE: "可借",
  BORROWED: "已借出",
  DAMAGED: "损坏",
  LOST: "丢失",
};

export default function BookCopyStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status.toLowerCase()}`}>{statusText[status]}</span>;
}
