export default function ReputationBadge({ level }: { level: number }) {
  /* TODO: swap static shield for Bonsai dynamic NFT img once template live */
  return (
    <span className="inline-flex items-center gap-1 text-xs text-white bg-purple-600 px-2 py-0.5 rounded">
      🛡️ Level {level}
    </span>
  );
}
