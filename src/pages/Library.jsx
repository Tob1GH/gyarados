import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useFetch } from '../hooks/useFetch.js';
import BookCard from '../components/BookCard.jsx';
import { EmptyState, ErrorState, GridSkeleton } from '../components/States.jsx';

const STATUSES = [
  ['', 'Any availability'],
  ['available', 'Available now'],
  ['unavailable', 'All copies out'],
];

export default function Library() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const status = params.get('status') || '';

  const books = useFetch((s) => api.books({ q, category, status }, s), [q, category, status]);
  const cats = useFetch((s) => api.categories(s), []);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const items = books.data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Library</h1>
          <p className="mt-1 text-ink-soft">
            {books.data ? `${books.data.total} title${books.data.total === 1 ? '' : 's'}` : 'Loading titles…'}
            {q && <> matching “{q}”</>}
          </p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Availability</span>
          <select className="input w-auto" value={status} onChange={(e) => setFilter('status', e.target.value)}>
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Categories">
        <button className={`chip ${!category ? 'chip-on' : ''}`} onClick={() => setFilter('category', '')}>All</button>
        {(cats.data || []).map((c) => (
          <button key={c} className={`chip ${category === c ? 'chip-on' : ''}`} onClick={() => setFilter('category', c)}>{c}</button>
        ))}
      </div>

      {books.error ? (
        <ErrorState error={books.error} onRetry={books.refetch} />
      ) : !books.data && books.loading ? (
        <GridSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title="No books match"
          hint="Try a shorter search, or clear the category and availability filters."
          action={<button className="btn-ghost mt-2" onClick={() => setParams({})}>Clear filters</button>}
        />
      ) : (
        <div className={`settle grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${books.loading ? 'opacity-60' : ''}`}>
          {items.map((b) => <BookCard key={b.id} book={b} onChanged={books.refetch} />)}
        </div>
      )}
    </div>
  );
}
