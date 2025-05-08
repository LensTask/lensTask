export default function ReputationBadge({ level }: { level: number }) {
  /* TODO: swap for Bonsai dynamic NFT image once template is live */
  return (
    <span className="inline-flex items-center gap-1 text-xs text-white bg-purple-600 px-2 py-0.5 rounded">
      🛡️ Level {level}
    </span>
  );
}
