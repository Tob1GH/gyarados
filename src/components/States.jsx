import Icon from './Icon.jsx';

export function ErrorState({ error, onRetry }) {
  return (
    <div className="panel flex flex-col items-start gap-3 border-brick/30 bg-brick-50 p-6">
      <div className="flex items-center gap-2 font-medium text-brick">
        <Icon name="alert" /> Couldn't load this data
      </div>
      <p className="text-sm text-ink-soft">
        {error?.message || 'The server did not respond.'} Check that the backend is running and that
        <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs">VITE_API_URL</code> points to it.
      </p>
      <button className="btn-ghost" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-14 text-center">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-ink-soft">{hint}</p>
      {action}
    </div>
  );
}

export function GridSkeleton({ count = 8, tall = true }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className={`skeleton ${tall ? 'aspect-[3/4]' : 'aspect-video'}`} />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
