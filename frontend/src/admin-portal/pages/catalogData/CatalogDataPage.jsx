// src/admin-portal/pages/catalogData/CatalogDataPage.jsx
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { FilterPills } from '../../components/common/FilterPills';
import { authorsService, categoriesService, publishersService } from '../../services/catalogDataService';
import { SimpleEntityList } from './SimpleEntityList';
import { LocationsTree } from './LocationsTree';

const TABS = [
  { key: 'categories', label: 'Categories' },
  { key: 'authors', label: 'Authors' },
  { key: 'publishers', label: 'Publishers' },
  { key: 'locations', label: 'Locations' },
];

export function CatalogDataPage() {
  const [tab, setTab] = useState('categories');

  return (
    <>
      <PageHeader title="Catalog Data" description="Authors, publishers, categories, and shelf locations behind the Catalogue." />

      <TableCard>
        <div className="table-toolbar">
          <FilterPills options={TABS} active={tab} onChange={setTab} />
        </div>
      </TableCard>

      <TableCard title={TABS.find((t) => t.key === tab).label}>
        {tab === 'categories' && <SimpleEntityList queryKey={['categories']} service={categoriesService} label="Categories" />}
        {tab === 'authors' && (
          <SimpleEntityList
            queryKey={['authors']}
            service={authorsService}
            label="Authors"
            extraField={{ key: 'bio', placeholder: 'Bio (optional)' }}
          />
        )}
        {tab === 'publishers' && (
          <SimpleEntityList
            queryKey={['publishers']}
            service={publishersService}
            label="Publishers"
            extraField={{ key: 'website', placeholder: 'Website (optional)' }}
          />
        )}
        {tab === 'locations' && <LocationsTree />}
      </TableCard>
    </>
  );
}
