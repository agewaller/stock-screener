export default function SourceBadge({ name, url }: { name: string; url?: string }) {
  if (!url) return <span className="text-riskMuted">{name}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="text-blue-400 underline-offset-2 hover:underline"
    >
      {name}
    </a>
  );
}
