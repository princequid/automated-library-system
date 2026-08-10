// src/admin-portal/pages/catalogData/LocationsTree.jsx
// Library -> Floor -> Section -> Shelf, managed as a simple nested read-only
// tree plus one small "add" row per level (add a library, or add-a-floor-to
// a chosen library, etc.) rather than a full drag/drop tree editor - this is
// reference data a librarian sets up rarely, not a daily-use surface.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { locationsService } from '../../services/locationsService';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';

function AddRow({ placeholder, onAdd, pending }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="fines-toolbar-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) {
          onAdd(value.trim());
          setValue('');
        }
      }}
    >
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} className="member-status-reason" />
      <Button type="submit" size="sm" loading={pending}>Add</Button>
    </form>
  );
}

export function LocationsTree() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useQuery({ queryKey: ['locations', 'tree'], queryFn: locationsService.tree });
  const libraries = query.data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['locations', 'tree'] });
  const onError = (err) => toast.error(apiErrorMessage(err));

  const addLibrary = useMutation({ mutationFn: (name) => locationsService.createLibrary(name), onSuccess: invalidate, onError });
  const addFloor = useMutation({ mutationFn: ({ libraryId, name }) => locationsService.createFloor(libraryId, name), onSuccess: invalidate, onError });
  const addSection = useMutation({ mutationFn: ({ floorId, name }) => locationsService.createSection(floorId, name), onSuccess: invalidate, onError });
  const addShelf = useMutation({ mutationFn: ({ sectionId, name }) => locationsService.createShelf(sectionId, name), onSuccess: invalidate, onError });

  if (query.isPending) return <LoadingState label="Loading locations…" />;
  if (query.isError) return <ErrorState message={apiErrorMessage(query.error)} onRetry={query.refetch} />;

  return (
    <div className="detail-field-full">
      <AddRow placeholder="New library name…" onAdd={(name) => addLibrary.mutate(name)} pending={addLibrary.isPending} />
      {libraries.length === 0 && <EmptyState title="No libraries yet" />}
      {libraries.map((lib) => (
        <section key={lib.id} className="detail-section" style={{ marginTop: 'var(--space-4)', boxShadow: 'none' }}>
          <h3 className="detail-section-title">{lib.name}</h3>
          {lib.floors.map((floor) => (
            <div key={floor.id} style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
              <strong className="detail-field-value">{floor.name}</strong>
              {floor.sections.map((section) => (
                <div key={section.id} style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <span className="detail-field-label">{section.name}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                    {section.shelves.map((shelf) => (
                      <code key={shelf.id} className="detail-field-value">{shelf.name}</code>
                    ))}
                  </div>
                  <AddRow placeholder="New shelf name…" onAdd={(name) => addShelf.mutate({ sectionId: section.id, name })} pending={addShelf.isPending} />
                </div>
              ))}
              <div style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <AddRow placeholder="New section name…" onAdd={(name) => addSection.mutate({ floorId: floor.id, name })} pending={addSection.isPending} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 'var(--space-3)' }}>
            <AddRow placeholder="New floor name…" onAdd={(name) => addFloor.mutate({ libraryId: lib.id, name })} pending={addFloor.isPending} />
          </div>
        </section>
      ))}
    </div>
  );
}
