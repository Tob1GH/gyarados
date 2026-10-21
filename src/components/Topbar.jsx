import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '../hooks/useFetch.js';
import Icon from './Icon.jsx';

const SEARCHABLE = ['/library', '/assets'];

export default function Topbar() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [value, setValue] = useState(params.get('q') || '');
  const debounced = useDebounce(value, 300);

  // Keep the box in sync when the page changes
  useEffect(() => setValue(params.get('q') || ''), [pathname]); // eslint-disable-line

  useEffect(() => {
    if ((params.get('q') || '') === debounced) return;
    if (!SEARCHABLE.includes(pathname)) {
      if (debounced) navigate(`/library?q=${encodeURIComponent(debounced)}`);
      return;
    }
    const next = new URLSearchParams(params);
    debounced ? next.set('q', debounced) : next.delete('q');
    setParams(next, { replace: true });
  }, [debounced]); // eslint-disable-line

  const placeholder = pathname === '/assets' ? 'Search files, tags and collections' : 'Search titles, authors and ISBNs';

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-shelf/90 px-4 py-3 backdrop-blur sm:px-8">
      <label className="relative flex-1 max-w-xl">
        <span className="sr-only">Search</span>
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
        <input
          className="input pl-9"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
      </label>
    </header>
  );
}
