import Link from "next/link";
import { PublicationFragment, Post } from "@lens-protocol/client";

const truncate = (str: string | null | undefined, len: number) =>
  str && str.length > len ? str.slice(0, len) + "…" : str || "";

interface QuestionCardProps {
  pub: PublicationFragment;
}

export default function QuestionCard({ pub }: QuestionCardProps) {
  /* TODO: replace union cast with SDK codegen fragments */
  const isPost     = pub.__typename === 'Post';
  const profile    = pub.by?.handle?.fullHandle ?? `Profile ${pub.by?.id}`;
  const title      = isPost ? (pub as Post).metadata?.title ?? "Untitled Question" : "Untitled";
  const content    = isPost ? (pub as Post).metadata?.content ?? "" : "";

  /* TODO: show answer count & bounty badge after subgraph ready */

  return (
    <Link
      href={pub.id ? `/question/${pub.id}` : "#"}
      className="block border p-4 rounded mb-3 hover:bg-gray-100 dark:border-gray-700"
    >
      <h2 className="font-semibold text-lg">{truncate(title, 80)}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{truncate(content, 150)}</p>
      <p className="text-xs text-gray-500 mt-2">By: {profile}</p>
    </Link>
  );
}
