// src/admin-portal/pages/circulation/CirculationPage.jsx
import { PageHeader } from '../../components/layout/PageHeader';
import { IssuePanel } from './IssuePanel';
import { ReturnPanel } from './ReturnPanel';
import { ReshelfPanel } from './ReshelfPanel';

export function CirculationPage() {
  return (
    <>
      <PageHeader title="Circulation" description="Desk workflow: issue, return, and reshelf." />
      <div className="circulation-layout">
        <IssuePanel />
        <div className="circulation-side-column">
          <ReturnPanel />
          <ReshelfPanel />
        </div>
      </div>
    </>
  );
}
