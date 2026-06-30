interface Props { progress: number; tint?: string }

export function ProgressBar({ progress, tint }: Props) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-footnote mb-1.5">
        <span>{progress}% elapsed</span>
        <span>{100 - progress}% remaining</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%`, background: tint ?? 'rgb(var(--accent-brand))' }}
        />
      </div>
    </div>
  );
}
