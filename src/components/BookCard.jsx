import { useState } from 'react';
import { hashIndex } from '../lib/format.js';
import { useToast } from './Toast.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const COVERS = [
  'bg-navy text-white', 'bg-teal text-white', 'bg-brick text-white',
  'bg-moss text-white', 'bg-saffron text-navy', 'bg-navy-700 text-saffron',
];

export default function BookCard({ book, onChanged }) {
  const toast = useToast();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const available = book.copiesAvailable > 0;
  const cover = COVERS[hashIndex(book.id, COVERS.length)];

  const borrow = async () => {
    setBusy(true);
    try {
      await api.borrowBook(book.id, user.name);
      toast(`Borrowed “${book.title}”`);
      onChanged();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="group flex flex-col">
      
<div className={`cover relative aspect-[3/4] overflow-hidden rounded-r-lg rounded-l-sm shadow-lift transition-transform group-hover:-translate-y-1 ${cover}`}>
  {book.coverImage ? (
    <img
      src={book.coverImage}
      alt={`Cover of ${book.title}`}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  ) : (
    <div className="h-full p-5 pl-7 text-white">
      <h3 className="text-xl font-extrabold leading-tight">
        {book.title}
      </h3>
      <p className="absolute bottom-4 left-7 right-4 text-sm">
        {book.author}
      </p>
    </div>
  )}
</div>


      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="text-sm text-ink-soft">{book.category} · {book.year}</p>
        {book.description && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-mute">{book.description}</p>}
        <span className={`badge shrink-0 ${available ? 'bg-moss-50 text-moss' : 'bg-brick-50 text-brick'}`}>
          {available ? `${book.copiesAvailable} of ${book.copiesTotal} in` : 'All out'}
        </span>
      </div>

      <button
        className={`mt-2 ${available ? 'btn-primary' : 'btn-ghost'}`}
        disabled={!available || busy}
        onClick={borrow}
      >
        {busy ? 'Borrowing…' : available ? 'Borrow' : 'Unavailable'}
      </button>
    </article>
  );
}
