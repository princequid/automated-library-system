// src/admin-portal/pages/overdues/OverduesPage.jsx
import { PageHeader } from '../../components/layout/PageHeader';
import { OverdueLoansCard } from './OverdueLoansCard';
import { FinesCard } from './FinesCard';

export function OverduesPage() {
  return (
    <>
      <PageHeader title="Overdues" description="Late loans and the fines they've generated." />
      <OverdueLoansCard />
      <FinesCard />
    </>
  );
}
