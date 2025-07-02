import { useState } from 'react';
import HeaderBar from "./components/HeaderBar";
import SpreadsheetTable from "./components/SpreadsheetTable";
import FooterTabs from "./components/FooterTabs";

export type SortField = 'submitted' | 'status' | 'submitter' | 'priority' | 'dueDate' | 'estValue';
export type FilterField = 'status' | 'priority' | 'submitter' | 'assigned' | 'submitted' | 'dueDate' | 'estValue';
export type CellViewMode = 'compact' | 'normal' | 'expanded';

export default function App() {
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [filterField, setFilterField] = useState<FilterField | null>(null);
  const [filterValue, setFilterValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cellViewMode, setCellViewMode] = useState<CellViewMode>('normal');

  const handleHideFields = (fields: string[]) => {
    setHiddenFields(fields);
    console.log('Fields hidden:', fields);
  };

  const handleSort = (field: SortField | null, order: 'asc' | 'desc' | null) => {
    setSortField(field);
    setSortOrder(order);
    console.log('Sort changed:', { field, order });
  };

  const handleFilter = (field: FilterField | null, value: string) => {
    setFilterField(field);
    setFilterValue(value);
    console.log('Filter changed:', { field, value });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    console.log('Search term changed:', term);
  };

  const handleCellView = (mode: CellViewMode) => {
    setCellViewMode(mode);
    console.log('Cell view mode changed:', mode);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <HeaderBar 
        onHideFields={handleHideFields}
        onSort={handleSort}
        onFilter={handleFilter}
        onSearch={handleSearch}
        onCellView={handleCellView}
        hiddenFields={hiddenFields}
        sortField={sortField}
        sortOrder={sortOrder}
        filterField={filterField}
        filterValue={filterValue}
        searchTerm={searchTerm}
        cellViewMode={cellViewMode}
      />
      <div className="flex-1 overflow-hidden">
        <SpreadsheetTable 
          hiddenFields={hiddenFields}
          sortField={sortField}
          sortOrder={sortOrder}
          filterField={filterField}
          filterValue={filterValue}
          searchTerm={searchTerm}
          cellViewMode={cellViewMode}
        />
      </div>
      <FooterTabs />
    </div>
  );
}
