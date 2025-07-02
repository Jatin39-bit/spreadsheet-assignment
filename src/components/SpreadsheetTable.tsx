import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { mockSpreadsheetData } from '../data/mockData';
import type { Status, Priority, SpreadsheetRow } from '../types';
import type { SortField, FilterField, CellViewMode } from '../App';

interface SpreadsheetTableProps {
  hiddenFields?: string[];
  sortField?: SortField | null;
  sortOrder?: 'asc' | 'desc' | null;
  filterField?: FilterField | null;
  filterValue?: string;
  searchTerm?: string;
  cellViewMode?: CellViewMode;
}

export default function SpreadsheetTable({ 
  hiddenFields = [], 
  sortField = null,
  sortOrder = null, 
  filterField = null,
  filterValue = '',
  searchTerm = '',
  cellViewMode = 'normal'
}: SpreadsheetTableProps) {
  const [data, setData] = useState<SpreadsheetRow[]>(mockSpreadsheetData);
  const [columnWidths, setColumnWidths] = useState<number[]>(Array(10).fill(160)); // Added one more for plus column
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isResizing, setIsResizing] = useState<{type: 'col', index: number} | null>(null);
  const [customColumns, setCustomColumns] = useState<string[]>([]); // Track custom columns
  
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeRef = useRef<{startX: number, startSize: number}>({startX: 0, startSize: 0});

  const headers = ['Job Request', 'Submitted', 'Status', 'Submitter', 'URL', 'Assigned', 'Priority', 'Due Date', 'Est. Value'];
  const fields = ['jobRequest', 'submitted', 'status', 'submitter', 'url', 'assigned', 'priority', 'dueDate', 'estValue'];

  // Combine base headers with custom columns
  const allHeaders = [...headers, ...customColumns];
  const allFields = [...fields, ...customColumns.map(col => col.toLowerCase().replace(/\s+/g, ''))];

  // Get cell height based on view mode
  const getCellHeight = () => {
    switch (cellViewMode) {
      case 'compact': return 'h-6';
      case 'expanded': return 'h-12';
      default: return 'h-8';
    }
  };

  // Get cell padding based on view mode
  const getCellPadding = () => {
    switch (cellViewMode) {
      case 'compact': return 'px-1 py-0.5';
      case 'expanded': return 'px-2 py-2';
      default: return 'px-1 py-1';
    }
  };

  // Get text size based on view mode
  const getTextSize = () => {
    switch (cellViewMode) {
      case 'compact': return 'text-xs';
      case 'expanded': return 'text-sm';
      default: return 'text-xs';
    }
  };

  // Filter and sort data based on props
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply filter
    if (filterField && filterValue) {
      filtered = filtered.filter(row => {
        const cellValue = String(row[filterField as keyof SpreadsheetRow] || '').toLowerCase();
        
        if (filterField === 'submitted' || filterField === 'dueDate') {
          // Date filtering - exact match for now
          return cellValue === filterValue.toLowerCase();
        } else {
          // Text filtering - contains
          return cellValue.includes(filterValue.toLowerCase());
        }
      });
    }
    
    // Apply sort
    if (sortField && sortOrder) {
      filtered.sort((a, b) => {
        let aValue: string | number | Date = a[sortField as keyof SpreadsheetRow] as string;
        let bValue: string | number | Date = b[sortField as keyof SpreadsheetRow] as string;
        
        // Handle different data types
        if (sortField === 'submitted' || sortField === 'dueDate') {
          // Date sorting
          aValue = new Date(aValue.split('-').reverse().join('-'));
          bValue = new Date(bValue.split('-').reverse().join('-'));
        } else if (sortField === 'estValue') {
          // Numeric sorting (remove commas)
          aValue = parseFloat(String(aValue).replace(/,/g, '')) || 0;
          bValue = parseFloat(String(bValue).replace(/,/g, '')) || 0;
        } else if (sortField === 'priority') {
          // Priority sorting (High > Medium > Low)
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[aValue as Priority] || 0;
          bValue = priorityOrder[bValue as Priority] || 0;
        } else {
          // String sorting
          aValue = String(aValue).toLowerCase();
          bValue = String(bValue).toLowerCase();
        }
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [data, filterField, filterValue, sortField, sortOrder]);

  // Check if a cell matches the search term
  const cellMatchesSearch = (row: SpreadsheetRow, fieldName: string): boolean => {
    if (!searchTerm.trim()) return false;
    
    const cellValue = String(row[fieldName as keyof SpreadsheetRow] || '').toLowerCase();
    return cellValue.includes(searchTerm.toLowerCase());
  };

  // Highlight matching text in a string
  const highlightText = (text: string, searchTerm: string): React.ReactElement => {
    if (!searchTerm.trim()) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <span key={index} className="bg-yellow-300 text-yellow-900 font-medium px-0.5 rounded">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Filter visible headers based on hidden fields
  const visibleHeaders = allHeaders.filter((header, index) => {
    const fieldName = allFields[index];
    return !hiddenFields.includes(fieldName);
  });

  const visibleFields = allFields.filter(field => !hiddenFields.includes(field));

  const handleUrlClick = (url: string) => {
    window.open(`https://${url}`, '_blank');
    console.log(`URL clicked: ${url}`);
  };

  const handleCellClick = (rowId: number, colIndex: number) => {
    if (editingCell) {
      saveEdit();
    }
    setSelectedCell({row: rowId, col: colIndex});
    console.log(`Cell clicked: Row ${rowId}, Column ${colIndex}`);
  };

  const handleCellDoubleClick = (rowId: number, colIndex: number) => {
    const cellValue = getCellValue(rowId, colIndex);
    setEditingCell({row: rowId, col: colIndex});
    setEditValue(cellValue);
    setSelectedCell({row: rowId, col: colIndex});
  };

  const getCellValue = (rowId: number, colIndex: number): string => {
    const dataRow = processedData.find(row => row.id === rowId);
    if (!dataRow) return '';
    
    const field = visibleFields[colIndex] as keyof SpreadsheetRow;
    return String(dataRow[field] || '');
  };

  const setCellValue = (rowId: number, colIndex: number, value: string) => {
    const field = visibleFields[colIndex] as keyof SpreadsheetRow;
    
    setData(prevData => 
      prevData.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
  };

  const saveEdit = () => {
    if (editingCell) {
      setCellValue(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const addRow = () => {
    const newId = Math.max(...data.map(row => row.id)) + 1;
    const newRow: SpreadsheetRow = {
      id: newId,
      jobRequest: '',
      submitted: new Date().toLocaleDateString('en-GB'),
      status: 'need to start',
      submitter: '',
      url: '',
      assigned: '',
      priority: 'Medium',
      dueDate: '',
      estValue: ''
    };
    
    // Add empty values for custom columns
    customColumns.forEach(col => {
      const fieldName = col.toLowerCase().replace(/\s+/g, '');
      (newRow as any)[fieldName] = '';
    });
    
    setData([...data, newRow]);
    console.log('New row added');
  };

  const addColumn = () => {
    const columnName = prompt('Enter new column name:');
    if (columnName && columnName.trim()) {
      const newColumnName = columnName.trim();
      setCustomColumns([...customColumns, newColumnName]);
      
      // Add the new column to all existing rows with empty values
      const fieldName = newColumnName.toLowerCase().replace(/\s+/g, '');
      setData(prevData => 
        prevData.map(row => ({
          ...row,
          [fieldName]: ''
        }))
      );
      
      // Extend column widths array
      setColumnWidths(prev => [...prev, 160]);
      
      console.log(`New column "${newColumnName}" added`);
    }
  };

  const deleteRow = (rowId: number) => {
    setData(data.filter(row => row.id !== rowId));
    console.log(`Row ${rowId} deleted`);
  };

  const startColumnResize = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing({type: 'col', index: colIndex});
    resizeRef.current = {
      startX: e.clientX,
      startSize: columnWidths[colIndex]
    };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const {index} = isResizing;
    const {startX, startSize} = resizeRef.current;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(80, startSize + deltaX);
    setColumnWidths(prev => prev.map((width, i) => i === index ? newWidth : width));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'in-progress':
        return 'bg-yellow-200 text-yellow-800 border-yellow-300';
      case 'need to start':
        return 'bg-blue-200 text-blue-800 border-blue-300';
      case 'complete':
        return 'bg-green-200 text-green-800 border-green-300';
      case 'blocked':
        return 'bg-red-200 text-red-800 border-red-300';
      default:
        return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-200 text-red-800 border-red-300';
      case 'Medium':
        return 'bg-yellow-200 text-yellow-800 border-yellow-300';
      case 'Low':
        return 'bg-blue-200 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-200 text-gray-800 border-gray-300';
    }
  };

  const formatStatus = (status: Status) => {
    switch (status) {
      case 'in-progress':
        return 'In-process';
      case 'need to start':
        return 'Need to start';
      case 'complete':
        return 'Complete';
      case 'blocked':
        return 'Blocked';
      default:
        return status;
    }
  };

  const renderCell = (row: SpreadsheetRow, colIndex: number) => {
    const fieldName = visibleFields[colIndex];
    const isEditing = editingCell?.row === row.id && editingCell?.col === colIndex;
    const hasSearchMatch = cellMatchesSearch(row, fieldName);
    
    if (isEditing) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          className={`w-full h-full px-2 border-2 border-blue-500 outline-none ${getTextSize()} bg-white`}
          autoFocus
        />
      );
    }

    const cellValue = getCellValue(row.id, colIndex);
    
    // Status column
    if (fieldName === 'status') {
      const statusText = formatStatus(row.status);
      return (
        <span className={`inline-block px-2 py-0.5 ${getTextSize()} font-medium rounded border ${getStatusColor(row.status)} ${
          hasSearchMatch ? 'ring-2 ring-yellow-400' : ''
        }`}>
          {searchTerm ? highlightText(statusText, searchTerm) : statusText}
        </span>
      );
    }
    
    // Priority column
    if (fieldName === 'priority') {
      return (
        <span className={`inline-block px-2 py-0.5 ${getTextSize()} font-medium rounded border ${getPriorityColor(row.priority)} ${
          hasSearchMatch ? 'ring-2 ring-yellow-400' : ''
        }`}>
          {searchTerm ? highlightText(row.priority, searchTerm) : row.priority}
        </span>
      );
    }
    
    // URL column
    if (fieldName === 'url') {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUrlClick(row.url);
          }}
          className={`text-blue-600 hover:text-blue-800 underline truncate w-full text-left ${getTextSize()} ${
            hasSearchMatch ? 'bg-yellow-100 rounded px-1' : ''
          }`}
        >
          {searchTerm ? highlightText(row.url, searchTerm) : row.url}
        </button>
      );
    }

    return (
      <div 
        className={`truncate ${getTextSize()} ${getCellPadding()} ${hasSearchMatch ? 'bg-yellow-100 rounded' : ''} ${
          cellViewMode === 'expanded' ? 'overflow-visible whitespace-normal' : ''
        }`} 
        title={cellValue}
      >
        {searchTerm ? highlightText(cellValue, searchTerm) : cellValue}
      </div>
    );
  };

  // Calculate search results count
  const searchResultsCount = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    
    let count = 0;
    processedData.forEach(row => {
      visibleFields.forEach(field => {
        if (cellMatchesSearch(row, field)) {
          count++;
        }
      });
    });
    return count;
  }, [processedData, visibleFields, searchTerm, cellMatchesSearch]);

  return (
    <div className="bg-white border border-gray-300 overflow-hidden h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          {(searchTerm || filterField || sortField) && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {searchTerm && (
                <span className="bg-yellow-100 px-2 py-1 rounded border">
                  Found {searchResultsCount} match{searchResultsCount !== 1 ? 'es' : ''} for "{searchTerm}"
                </span>
              )}
              {filterField && (
                <span className="bg-blue-100 px-2 py-1 rounded border">
                  Filtered by {filterField}: {filterValue}
                </span>
              )}
              {sortField && (
                <span className="bg-purple-100 px-2 py-1 rounded border">
                  Sorted by {sortField} ({sortOrder?.toUpperCase()})
                </span>
              )}
            </div>
          )}
          <div className="text-xs text-gray-500">
            View: {cellViewMode} • Showing {processedData.length} of {data.length} rows • {allHeaders.length} columns
          </div>
        </div>
        {selectedCell && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">
              Selected: Row {selectedCell.row}, Col {selectedCell.col + 1}
            </span>
            <button
              onClick={() => selectedCell && deleteRow(selectedCell.row)}
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
            >
              Delete Row
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table ref={tableRef} className="w-full border-collapse bg-white">
          <thead>
            {/* Field names header row */}
            <tr className="sticky top-0 z-10">
              <th className={`w-16 ${getCellHeight()} bg-gray-100 border-r border-b border-gray-300 ${getTextSize()} text-gray-600 font-normal sticky left-0 z-20 relative`}>
                <div className="flex items-center justify-center">
                  <span>#</span>
                  <button
                    onClick={addRow}
                    className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
                    title="Add new row"
                  >
                    <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </th>
              {visibleHeaders.map((header, index) => (
                <th 
                  key={header} 
                  className={`${getCellHeight()} bg-gray-50 border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-medium px-2 text-left relative`}
                  style={{width: columnWidths[index], minWidth: 80}}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                  </div>
                  {/* Column resize handle */}
                  <div 
                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50"
                    onMouseDown={(e) => startColumnResize(index, e)}
                  />
                </th>
              ))}
              {/* Add Column button */}
              <th 
                className={`w-12 ${getCellHeight()} bg-gray-50 border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-medium px-2 text-center relative`}
              >
                <button
                  onClick={addColumn}
                  className="flex items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Add new column"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, _) => {
              const hasRowMatch = visibleFields.some(field => cellMatchesSearch(row, field));
              return (
                <tr key={row.id} className={`hover:bg-blue-50 ${hasRowMatch ? 'bg-yellow-50 border-l-2 border-yellow-400' : ''}`}>
                  {/* Row number */}
                  <td 
                    className={`w-16 ${getCellHeight()} bg-gray-100 border-r border-b border-gray-300 ${getTextSize()} text-gray-600 font-normal text-center sticky left-0 z-10`}
                  >
                    {row.id}
                  </td>
                  
                  {visibleHeaders.map((_, colIndex) => {
                    const isSelected = selectedCell?.row === row.id && selectedCell?.col === colIndex;
                    const hasMatch = cellMatchesSearch(row, visibleFields[colIndex]);
                    return (
                      <td 
                        key={colIndex}
                        className={`${getCellHeight()} border-r border-b border-gray-300 ${getTextSize()} cursor-cell relative ${
                          isSelected ? 'border-2 border-blue-500 bg-blue-50' : 'hover:border-blue-300'
                        } ${hasMatch ? 'bg-yellow-50' : ''}`}
                        style={{width: columnWidths[colIndex], minWidth: 80}}
                        onClick={() => handleCellClick(row.id, colIndex)}
                        onDoubleClick={() => handleCellDoubleClick(row.id, colIndex)}
                      >
                        <div className={`h-full flex items-center ${cellViewMode === 'expanded' ? 'items-start pt-1' : ''}`}>
                          {renderCell(row, colIndex)}
                        </div>
                      </td>
                    );
                  })}
                  {/* Add Column cell */}
                  <td 
                    className={`w-12 ${getCellHeight()} border-r border-b border-gray-300 cursor-default bg-gray-50`}
                  >
                  </td>
                </tr>
              );
            })}
            
            {/* Empty rows */}
            {Array.from({ length: 15 }, (_, index) => (
              <tr key={`empty-${index}`} className="hover:bg-blue-50">
                <td 
                  className={`w-16 ${getCellHeight()} bg-gray-100 border-r border-b border-gray-300 ${getTextSize()} text-gray-600 font-normal text-center sticky left-0 z-10`}
                >
                  {processedData.length + index + 1}
                </td>
                {visibleHeaders.map((_, colIndex) => {
                  const rowId = processedData.length + index + 1;
                  const isSelected = selectedCell?.row === rowId && selectedCell?.col === colIndex;
                  return (
                    <td 
                      key={colIndex}
                      className={`${getCellHeight()} border-r border-b border-gray-300 cursor-cell ${
                        isSelected ? 'border-2 border-blue-500 bg-blue-50' : 'hover:border-blue-300'
                      }`}
                      style={{width: columnWidths[colIndex], minWidth: 80}}
                      onClick={() => handleCellClick(rowId, colIndex)}
                      onDoubleClick={() => handleCellDoubleClick(rowId, colIndex)}
                    >
                      {index === 0 && colIndex === 0 && (
                        <div className="w-16 h-4 border border-blue-500 bg-blue-50 rounded m-1"></div>
                      )}
                    </td>
                  );
                })}
                {/* Add Column cell for empty rows */}
                <td 
                  className={`w-12 ${getCellHeight()} border-r border-b border-gray-300 cursor-default bg-gray-50`}
                >
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}