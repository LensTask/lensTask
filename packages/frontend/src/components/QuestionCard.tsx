import Link from "next/link";
import { PublicationFragment, Post } from "@lens-protocol/client";

const truncate = (str: string | null | undefined, length: number): string => {
  if (!str) return "";
  return str.length <= length ? str : str.substring(0, length) + "...";
};

interface QuestionCardProps {
  pub: PublicationFragment;
}

export default function QuestionCard({ pub }: QuestionCardProps) {
  /* TODO: migrate to generated fragments to avoid cast */
  const isPost = pub.__typename === 'Post';

  let title = "Untitled Question";
  let content = "";
  const profileHandle = pub.by?.handle?.fullHandle ?? `Profile ${pub.by?.id}`;

  if (isPost) {
    const post = pub as Post;
    title   = post.metadata?.title   || post.metadata?.name || title;
    content = post.metadata?.content || "";
  } else {
    content = (pub as any).metadata?.content || "Cannot display content.";
    title   = (pub as any).metadata?.name    || `Publication ID: ${pub.id}`;
  }

  /* TODO: display bounty amount & answer count */
  return (
    <Link
      href={pub.id ? `/question/${pub.id}` : '#'}
      className="block border p-4 rounded mb-3 hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
    >
      <h2 className="font-semibold text-lg">{truncate(title, 80)}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{truncate(content, 150)}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">By: {profileHandle}</p>
      <p className="text-xs text-gray-500 dark:text-gray-500">Type: {pub.__typename}</p>
    </Link>
  );
}
