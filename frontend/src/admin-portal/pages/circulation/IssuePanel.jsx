// src/admin-portal/pages/circulation/IssuePanel.jsx
// POST /circulation/issue takes a specific copy_id, not a barcode (see
// backend/src/modules/circulation/dto/circulation.dto.ts) - so issuing means
// finding the title, picking one of its AVAILABLE copies, then picking the
// borrower, in that order.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { apiErrorMessage } from '@/lib/api';
import { catalogService } from '../../services/catalogService';
import { membersService } from '../../services/membersService';
import { circulationService } from '../../services/circulationService';
import { TableCard } from '../../components/common/TableCard';
import { SearchBar } from '../../components/common/SearchBar';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../components/common/Toast';

// Issuing is normally a Librarian action (requireLibrarianOrOverride() on the
// backend) - an Administrator can still do it, but only with a reason, which
// is recorded on the audit log as an override.
export function IssuePanel() {
  const { user } = useAuthStore();
  const isAdministrator = user?.role === 'ADMINISTRATOR';
  const [titleQuery, setTitleQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCopyId, setSelectedCopyId] = useState(null);
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const queryClient = useQueryClient();
  const toast = useToast();

  const itemsQuery = useQuery({
    queryKey: ['catalog', 'items', 'issue-search', titleQuery],
    queryFn: () => catalogService.list({ search: titleQuery, limit: 8 }),
    enabled: titleQuery.length > 1 && !selectedItem,
  });

  const copiesQuery = useQuery({
    queryKey: ['catalog', 'copies', selectedItem?.id],
    queryFn: () => catalogService.listCopies(selectedItem.id),
    enabled: !!selectedItem,
  });

  const membersQuery = useQuery({
    queryKey: ['users', 'issue-search', memberQuery],
    queryFn: () => membersService.list({ search: memberQuery, limit: 8 }),
    enabled: memberQuery.length > 1 && !selectedMember,
  });

  const issue = useMutation({
    mutationFn: () =>
      circulationService.issue({
        copy_id: selectedCopyId,
        user_id: selectedMember.id,
        ...(isAdministrator ? { override_reason: overrideReason.trim() } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] });
      toast.success(`Issued "${selectedItem.title}" to ${selectedMember.name}.`);
      reset();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not issue this book.')),
  });

  function reset() {
    setTitleQuery('');
    setSelectedItem(null);
    setSelectedCopyId(null);
    setMemberQuery('');
    setSelectedMember(null);
    setOverrideReason('');
  }

  const availableCopies = (copiesQuery.data?.data ?? []).filter((c) => c.status === 'AVAILABLE');

  return (
    <TableCard title="Issue a book" description="Find the title, pick a copy, then the borrower.">
      <div className="circulation-issue-grid">
        <div className="circulation-step">
          <span className="circulation-step-label">1. Title</span>
          {selectedItem ? (
            <div className="circulation-selected-chip">
              <span>{selectedItem.title}</span>
              <button type="button" onClick={() => { setSelectedItem(null); setSelectedCopyId(null); }}>
                Change
              </button>
            </div>
          ) : (
            <>
              <SearchBar value={titleQuery} onSearch={setTitleQuery} placeholder="Search by title or author…" />
              {itemsQuery.isFetching && <LoadingState label="Searching…" />}
              {itemsQuery.data?.data?.length > 0 && (
                <ul className="circulation-result-list">
                  {itemsQuery.data.data.map((item) => (
                    <li key={item.id}>
                      <button type="button" onClick={() => setSelectedItem(item)}>
                        {item.title} <span className="circulation-result-meta">{item.available_copies} available</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {titleQuery.length > 1 && itemsQuery.isSuccess && itemsQuery.data?.data?.length === 0 && (
                <p className="circulation-no-results">No matching titles.</p>
              )}
            </>
          )}
        </div>

        <div className="circulation-step">
          <span className="circulation-step-label">2. Copy</span>
          {!selectedItem && <p className="circulation-step-placeholder">Pick a title first.</p>}
          {selectedItem && copiesQuery.isPending && <LoadingState label="Loading copies…" />}
          {selectedItem && copiesQuery.isSuccess && availableCopies.length === 0 && (
            <EmptyState title="No available copies" description="Every copy of this title is currently out." />
          )}
          {availableCopies.length > 0 && (
            <ul className="circulation-result-list">
              {availableCopies.map((copy) => (
                <li key={copy.id}>
                  <button
                    type="button"
                    className={copy.id === selectedCopyId ? 'is-selected' : ''}
                    onClick={() => setSelectedCopyId(copy.id)}
                  >
                    {copy.barcode}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="circulation-step">
          <span className="circulation-step-label">3. Borrower</span>
          {selectedMember ? (
            <div className="circulation-selected-chip">
              <span>{selectedMember.name}</span>
              <button type="button" onClick={() => setSelectedMember(null)}>
                Change
              </button>
            </div>
          ) : (
            <>
              <SearchBar value={memberQuery} onSearch={setMemberQuery} placeholder="Search name, email, or ID…" />
              {membersQuery.isFetching && <LoadingState label="Searching…" />}
              {membersQuery.data?.data?.length > 0 && (
                <ul className="circulation-result-list">
                  {membersQuery.data.data.map((member) => (
                    <li key={member.id}>
                      <button type="button" onClick={() => setSelectedMember(member)}>
                        {member.name} <span className="circulation-result-meta">{member.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {isAdministrator && (
        <FormField label="Override reason" required hint="Issuing is normally a Librarian action - required for the audit trail.">
          {(props) => (
            <input {...props} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Why is this being done by an Administrator?" />
          )}
        </FormField>
      )}

      <Button
        onClick={() => issue.mutate()}
        loading={issue.isPending}
        disabled={!selectedCopyId || !selectedMember || (isAdministrator && !overrideReason.trim())}
        className="circulation-issue-submit"
      >
        Issue book
      </Button>
    </TableCard>
  );
}
