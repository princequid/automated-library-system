// src/admin-portal/components/common/SearchBar.jsx
import { useEffect, useState } from 'react';
import { SearchIcon, CloseIcon } from './Icons';

const DEBOUNCE_MS = 300;

/** Debounced text search input; calls onSearch(value) after the user pauses typing. */
export function SearchBar({ value, onSearch, placeholder = 'Search…', className = '' }) {
  const [draft, setDraft] = useState(value ?? '');

  useEffect(() => setDraft(value ?? ''), [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (draft !== value) onSearch(draft);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <div className={`search-bar ${className}`.trim()}>
      <SearchIcon size={16} className="search-bar-icon" aria-hidden="true" />
      <input
        type="search"
        className="search-bar-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {draft && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={() => {
            setDraft('');
            onSearch('');
          }}
          aria-label="Clear search"
        >
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}
