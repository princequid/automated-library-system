// frontend/src/pages/student/SearchPage.tsx
// Browse/search the catalog. Debounced search, subject filter, available-only
// toggle, responsive result grid with staggered fade-in, and full skeleton/empty
// states.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, MapPin } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SkeletonCard } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { AvailabilityBadge, BookCover, PageHeader } from '@/components/shared';
import { useCatalog } from '@/hooks/api';

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function SearchPage() {
  const [search, setSearch] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const debouncedSearch = useDebounced(search);

  const params = useMemo(
    () => ({ search: debouncedSearch || undefined, available_only: availableOnly, limit: 24 }),
    [debouncedSearch, availableOnly]
  );
  const { data, isLoading, isError, refetch } = useCatalog(params);
  const items = data?.items ?? [];

  return (
    <PageTransition>
      <PageHeader title="Search the catalog" subtitle="Find and borrow a book in seconds." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or author…"
            icon={<SearchIcon className="h-4 w-4" />}
            aria-label="Search catalog"
          />
        </div>
        <label className="flex items-center gap-2.5">
          <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} id="available-only" />
          <Label htmlFor="available-only" className="cursor-pointer text-text-secondary">
            Available only
          </Label>
        </label>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={search ? `No results for "${search}"` : 'No books found'}
          description="Try a different title, author, or clear the available-only filter."
          icon={<SearchIcon className="h-6 w-6" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.5), duration: 0.25 }}
            >
              <Link to={`/student/book/${item.id}`}>
                <Card interactive className="flex h-full gap-4 p-4">
                  <div className="h-24 w-16 shrink-0">
                    <BookCover item={item} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 text-sm font-medium text-text-primary">{item.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">{item.author}</p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <AvailabilityBadge available={item.available_copies} />
                      {item.shelf_location && (
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                          <MapPin className="h-3 w-3" /> {item.shelf_location}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
