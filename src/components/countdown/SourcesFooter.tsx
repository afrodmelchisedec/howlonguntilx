interface Props {
  sources?: { label: string; url: string }[];
  lastReviewed?: string;
}

export function SourcesFooter({ sources, lastReviewed }: Props) {
  if (!sources?.length && !lastReviewed) return null;
  return (
    <div className="text-left" style={{ borderTop: '1px solid var(--border-hairline)', paddingTop: 16 }}>
      {lastReviewed && (
        <p className="text-footnote mb-2">
          Last reviewed {new Date(lastReviewed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      )}
      {sources && sources.length > 0 && (
        <p className="text-footnote">
          Sources:{' '}
          {sources.map((s, i) => (
            <span key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: 'rgb(var(--accent-brand))' }}>{s.label}</a>
              {i < sources.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
