import Link from "next/link";

type BookCardProps = {
  id: number;
  title: string;
  author: string | null;
  category: string | null;
  totalCopies: number;
  availableCopies: number;
};

export default function BookCard(props: BookCardProps) {
  return (
    <Link className="card stack" href={`/books/${props.id}`}>
      <strong>{props.title}</strong>
      <span className="muted">{props.author || "作者未填写"} · {props.category || "未分类"}</span>
      <span>
        可借 {props.availableCopies} / 总计 {props.totalCopies}
      </span>
    </Link>
  );
}
