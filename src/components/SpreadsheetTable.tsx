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

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'cell' | 'row' | 'column';
  rowIndex?: number;
  colIndex?: number;
  onClose: () => void;
  onAction: (action: string, data?: any) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, type, rowIndex, colIndex, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuItems = {
    cell: [
      { label: 'Add Row Above', action: 'addRowAbove' },
      { label: 'Add Row Below', action: 'addRowBelow' },
      { label: 'Add Column Left', action: 'addColumnLeft' },
      { label: 'Add Column Right', action: 'addColumnRight' },
      { label: 'Delete Row', action: 'deleteRow', danger: true },
      { label: 'Delete Column', action: 'deleteColumn', danger: true },
      { label: 'Duplicate Row', action: 'duplicateRow' },
      { label: 'Clear Cell', action: 'clearCell' },
    ],
    row: [
      { label: 'Add Row Above', action: 'addRowAbove' },
      { label: 'Add Row Below', action: 'addRowBelow' },
      { label: 'Delete Row', action: 'deleteRow', danger: true },
      { label: 'Duplicate Row', action: 'duplicateRow' },
      { label: 'Clear Row', action: 'clearRow' },
    ],
    column: [
      { label: 'Add Column Left', action: 'addColumnLeft' },
      { label: 'Add Column Right', action: 'addColumnRight' },
      { label: 'Delete Column', action: 'deleteColumn', danger: true },
      { label: 'Clear Column', action: 'clearColumn' },
    ]
  };

  return (
    <div
      ref={menuRef}
      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 w-36 backdrop-blur-sm"
      style={{ left: x, top: y }}
    >
      {menuItems[type].map((item, index) => (
        <button
          key={index}
          onClick={() => {
            onAction(item.action, { rowIndex, colIndex });
            onClose();
          }}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
            item.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

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
  const [columnWidths, setColumnWidths] = useState<number[]>(Array(15).fill(160));
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isResizing, setIsResizing] = useState<{type: 'col', index: number} | null>(null);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, type: 'cell' | 'row' | 'column', rowIndex?: number, colIndex?: number} | null>(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const resizeRef = useRef<{startX: number, startSize: number}>({startX: 0, startSize: 0});

  const headers = ['Job Request', 'Submitted', 'Status', 'Submitter', 'URL', 'Assigned', 'Priority', 'Due Date', 'Est. Value'];
  const fields = ['jobRequest', 'submitted', 'status', 'submitter', 'url', 'assigned', 'priority', 'dueDate', 'estValue'];

  // Combine base headers with custom columns
  const allHeaders = [...headers, ...customColumns];
  const allFields = [...fields, ...customColumns.map(col => col.toLowerCase().replace(/\s+/g, ''))];

  // Get cell height based on view mode and content
  const getCellHeight = (content?: string) => {
    let baseHeight;
    switch (cellViewMode) {
      case 'compact': 
        baseHeight = 32; // 8 * 4px
        break;
      case 'expanded': 
        baseHeight = 64; // 16 * 4px
        break;
      default: 
        baseHeight = 40; // 10 * 4px
    }
    
    // If content is provided, calculate dynamic height
    if (content && content.length > 50) {
      const extraLines = Math.ceil((content.length - 50) / 40);
      const lineHeight = cellViewMode === 'compact' ? 16 : cellViewMode === 'expanded' ? 20 : 18;
      const dynamicHeight = baseHeight + (extraLines * lineHeight);
      return `h-[${dynamicHeight}px]`;
    }
    
    // Return default height class
    switch (cellViewMode) {
      case 'compact': return 'h-8';
      case 'expanded': return 'h-16';
      default: return 'h-10';
    }
  };

  // Get cell padding based on view mode
  const getCellPadding = () => {
    switch (cellViewMode) {
      case 'compact': return 'px-2 py-1';
      case 'expanded': return 'px-3 py-3';
      default: return 'px-2 py-2';
    }
  };

  // Get text size based on view mode
  const getTextSize = () => {
    switch (cellViewMode) {
      case 'compact': return 'text-xs';
      case 'expanded': return 'text-base';
      default: return 'text-sm';
    }
  };

  // Calculate row height based on longest content in the row
  const getRowHeight = (row: SpreadsheetRow) => {
    let maxHeight = cellViewMode === 'compact' ? 32 : cellViewMode === 'expanded' ? 64 : 40;
    
    visibleFields.forEach(field => {
      const content = String(row[field as keyof SpreadsheetRow] || '');
      if (content.length > 50) {
        const extraLines = Math.ceil((content.length - 50) / 40);
        const lineHeight = cellViewMode === 'compact' ? 16 : cellViewMode === 'expanded' ? 20 : 18;
        const cellHeight = (cellViewMode === 'compact' ? 32 : cellViewMode === 'expanded' ? 64 : 40) + (extraLines * lineHeight);
        maxHeight = Math.max(maxHeight, cellHeight);
      }
    });
    
    return `h-[${maxHeight}px]`;
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
      startSize: columnWidths[colIndex] || 160
    };
    
    // Add cursor style to body
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const {index} = isResizing;
    const {startX, startSize} = resizeRef.current;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(100, startSize + deltaX);
    
    setColumnWidths(prev => {
      const newWidths = [...prev];
      newWidths[index] = newWidth;
      return newWidths;
    });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
    setIsResizing(null);
      // Reset cursor
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isResizing]);

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
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'need to start':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStatus = (status: Status) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'need to start':
        return 'Need to Start';
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
      // Status dropdown when editing
      if (fieldName === 'status') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={`w-full h-full px-2 border-2 border-blue-500 outline-none ${getTextSize()} bg-white rounded`}
            autoFocus
          >
            <option value="in-progress">In Progress</option>
            <option value="need to start">Need to Start</option>
            <option value="complete">Complete</option>
            <option value="blocked">Blocked</option>
          </select>
        );
      }
      
      // Priority dropdown when editing
      if (fieldName === 'priority') {
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className={`w-full h-full px-2 border-2 border-blue-500 outline-none ${getTextSize()} bg-white rounded`}
            autoFocus
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        );
      }
      
      // Regular text input for other fields
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          className={`w-full h-full px-2 border-2 border-blue-500 outline-none ${getTextSize()} bg-white rounded`}
          autoFocus
        />
      );
    }

    const cellValue = getCellValue(row.id, colIndex);
    
    // Status column
    if (fieldName === 'status') {
      const statusText = formatStatus(row.status);
      return (
        <div className="w-full">
          <div className={`inline-flex items-center justify-between w-full px-2 py-1 ${getTextSize()} font-medium rounded-md border ${getStatusColor(row.status)} ${
          hasSearchMatch ? 'ring-2 ring-yellow-400' : ''
          } cursor-pointer hover:shadow-sm transition-all duration-200 min-w-0`}>
            <span className="flex-1 truncate">
          {searchTerm ? highlightText(statusText, searchTerm) : statusText}
        </span>
            <svg className="w-3 h-3 text-gray-600 ml-2 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      );
    }
    
    // Priority column
    if (fieldName === 'priority') {
      return (
        <div className="w-full">
          <div className={`inline-flex items-center justify-between w-full px-2 py-1 ${getTextSize()} font-medium rounded-md border ${getPriorityColor(row.priority)} ${
          hasSearchMatch ? 'ring-2 ring-yellow-400' : ''
          } cursor-pointer hover:shadow-sm transition-all duration-200 min-w-0`}>
            <span className="flex-1 truncate">
          {searchTerm ? highlightText(row.priority, searchTerm) : row.priority}
        </span>
            <svg className="w-3 h-3 text-gray-600 ml-2 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
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
        className={`${cellValue.length > 50 ? 'whitespace-normal break-words' : 'truncate'} ${getTextSize()} ${getCellPadding()} ${hasSearchMatch ? 'bg-yellow-100 rounded' : ''} ${
          cellViewMode === 'expanded' || cellValue.length > 50 ? 'overflow-visible whitespace-normal' : ''
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

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing
      if (editingCell) return;

      // Handle Ctrl+Shift combinations
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'R':
            e.preventDefault();
            addRow();
            break;
          case 'C':
            e.preventDefault();
            addColumn();
            break;
        }
        return;
      }

      // Handle navigation and other shortcuts
      if (selectedCell) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            navigateCell('up');
            break;
          case 'ArrowDown':
            e.preventDefault();
            navigateCell('down');
            break;
          case 'ArrowLeft':
            e.preventDefault();
            navigateCell('left');
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigateCell('right');
            break;
          case 'Delete':
            e.preventDefault();
            if (e.shiftKey) {
              // Shift+Delete: Delete row
              deleteRow(selectedCell.row);
            } else {
              // Delete: Clear cell
              clearCell(selectedCell.row, selectedCell.col);
            }
            break;
          case 'Enter':
            e.preventDefault();
            if (e.shiftKey) {
              navigateCell('up');
            } else {
              navigateCell('down');
            }
            break;
          case 'Tab':
            e.preventDefault();
            if (e.shiftKey) {
              navigateCell('left');
            } else {
              navigateCell('right');
            }
            break;
          case 'Escape':
            e.preventDefault();
            setSelectedCell(null);
            setSelectedCells(new Set());
            break;
        }
      }

      // Handle Ctrl+A for select all
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, editingCell, processedData, visibleFields, data]);

  // Navigation helper
  const navigateCell = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (direction) {
      case 'up':
        const upRowIndex = processedData.findIndex(row => row.id === selectedCell.row);
        if (upRowIndex > 0) {
          newRow = processedData[upRowIndex - 1].id;
        }
        break;
      case 'down':
        const downRowIndex = processedData.findIndex(row => row.id === selectedCell.row);
        if (downRowIndex < processedData.length - 1) {
          newRow = processedData[downRowIndex + 1].id;
        } else {
          // Auto-add row if at the end
          addRow();
          newRow = Math.max(...data.map(row => row.id)) + 1;
        }
        break;
      case 'left':
        newCol = Math.max(0, selectedCell.col - 1);
        break;
      case 'right':
        if (selectedCell.col < visibleFields.length - 1) {
          newCol = selectedCell.col + 1;
        } else {
          // Auto-add column if at the end
          addColumn();
          newCol = selectedCell.col + 1;
        }
        break;
    }

    setSelectedCell({ row: newRow, col: newCol });
  };

  // Clear cell content
  const clearCell = (rowId: number, colIndex: number) => {
    const field = visibleFields[colIndex] as keyof SpreadsheetRow;
    setData(prevData => 
      prevData.map(row => 
        row.id === rowId ? { ...row, [field]: '' } : row
      )
    );
  };

  // Select all cells
  const selectAll = () => {
    const allCells = new Set<string>();
    processedData.forEach(row => {
      visibleFields.forEach((_, colIndex) => {
        allCells.add(`${row.id}-${colIndex}`);
      });
    });
    setSelectedCells(allCells);
    setIsMultiSelect(true);
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, type: 'cell' | 'row' | 'column', rowIndex?: number, colIndex?: number) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      rowIndex,
      colIndex
    });
  };

  // Context menu actions
  const handleContextAction = (action: string, data?: any) => {
    const { rowIndex, colIndex } = data || {};
    
    switch (action) {
      case 'addRowAbove':
        addRowAt(rowIndex);
        break;
      case 'addRowBelow':
        addRowAt(rowIndex + 1);
        break;
      case 'addColumnLeft':
        addColumnAt(colIndex);
        break;
      case 'addColumnRight':
        addColumnAt(colIndex + 1);
        break;
      case 'deleteRow':
        if (rowIndex !== undefined) {
          const rowId = processedData[rowIndex]?.id;
          if (rowId) deleteRow(rowId);
        }
        break;
      case 'deleteColumn':
        if (colIndex !== undefined) {
          deleteColumn(colIndex);
        }
        break;
      case 'duplicateRow':
        if (rowIndex !== undefined) {
          const rowId = processedData[rowIndex]?.id;
          if (rowId) duplicateRow(rowId);
        }
        break;
      case 'clearCell':
        if (rowIndex !== undefined && colIndex !== undefined) {
          const rowId = processedData[rowIndex]?.id;
          if (rowId) clearCell(rowId, colIndex);
        }
        break;
      case 'clearRow':
        if (rowIndex !== undefined) {
          const rowId = processedData[rowIndex]?.id;
          if (rowId) clearRow(rowId);
        }
        break;
      case 'clearColumn':
        if (colIndex !== undefined) {
          clearColumn(colIndex);
        }
        break;
    }
  };

  // Add row at specific position
  const addRowAt = (position?: number) => {
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
    
    if (position !== undefined && position < data.length) {
      const newData = [...data];
      newData.splice(position, 0, newRow);
      setData(newData);
    } else {
      setData([...data, newRow]);
    }
    
    console.log('New row added at position:', position);
  };

  // Add column at specific position
  const addColumnAt = (position?: number) => {
    const columnName = prompt('Enter new column name:');
    if (columnName && columnName.trim()) {
      const newColumnName = columnName.trim();
      const newCustomColumns = [...customColumns];
      
      if (position !== undefined && position < allHeaders.length) {
        newCustomColumns.splice(position, 0, newColumnName);
      } else {
        newCustomColumns.push(newColumnName);
      }
      
      setCustomColumns(newCustomColumns);
      
      // Add the new column to all existing rows with empty values
      const fieldName = newColumnName.toLowerCase().replace(/\s+/g, '');
      setData(prevData => 
        prevData.map(row => ({
          ...row,
          [fieldName]: ''
        }))
      );
      
      // Extend column widths array
      setColumnWidths(prev => {
        const newWidths = [...prev];
        if (position !== undefined && position < prev.length) {
          newWidths.splice(position, 0, 160);
        } else {
          newWidths.push(160);
        }
        return newWidths;
      });
      
      console.log(`New column "${newColumnName}" added at position:`, position);
    }
  };

  // Delete column
  const deleteColumn = (colIndex: number) => {
    if (colIndex < fields.length) {
      alert('Cannot delete built-in columns');
      return;
    }
    
    const customColIndex = colIndex - fields.length;
    if (customColIndex >= 0 && customColIndex < customColumns.length) {
      const columnToDelete = customColumns[customColIndex];
      const fieldName = columnToDelete.toLowerCase().replace(/\s+/g, '');
      
      if (confirm(`Delete column "${columnToDelete}"?`)) {
        // Remove from custom columns
        setCustomColumns(prev => prev.filter((_, i) => i !== customColIndex));
        
        // Remove from data
        setData(prevData => 
          prevData.map(row => {
            const newRow = { ...row };
            delete (newRow as any)[fieldName];
            return newRow;
          })
        );
        
        // Remove from column widths
        setColumnWidths(prev => prev.filter((_, i) => i !== colIndex));
        
        console.log(`Column "${columnToDelete}" deleted`);
      }
    }
  };

  // Duplicate row
  const duplicateRow = (rowId: number) => {
    const rowToDuplicate = data.find(row => row.id === rowId);
    if (rowToDuplicate) {
      const newId = Math.max(...data.map(row => row.id)) + 1;
      const duplicatedRow = { ...rowToDuplicate, id: newId };
      setData([...data, duplicatedRow]);
      console.log(`Row ${rowId} duplicated`);
    }
  };

  // Clear row
  const clearRow = (rowId: number) => {
    setData(prevData => 
      prevData.map(row => {
        if (row.id === rowId) {
          const clearedRow = { ...row };
          // Clear all fields except id
          Object.keys(clearedRow).forEach(key => {
            if (key !== 'id') {
              (clearedRow as any)[key] = '';
            }
          });
          return clearedRow;
        }
        return row;
      })
    );
  };

  // Clear column
  const clearColumn = (colIndex: number) => {
    const field = visibleFields[colIndex] as keyof SpreadsheetRow;
    setData(prevData => 
      prevData.map(row => ({ ...row, [field]: '' }))
    );
  };

  // Batch actions
  const handleBatchAction = (action: string) => {
    const selectedRowIds = Array.from(selectedCells).map(cellId => {
      const [rowId] = cellId.split('-');
      return parseInt(rowId);
    });
    const uniqueRowIds = Array.from(new Set(selectedRowIds));

    switch (action) {
      case 'deleteRows':
        if (confirm(`Delete ${uniqueRowIds.length} selected rows?`)) {
          setData(prevData => prevData.filter(row => !uniqueRowIds.includes(row.id)));
          setSelectedCells(new Set());
        }
        break;
      case 'duplicateRows':
        const rowsToDuplicate = data.filter(row => uniqueRowIds.includes(row.id));
        const newRows = rowsToDuplicate.map(row => ({
          ...row,
          id: Math.max(...data.map(r => r.id)) + rowsToDuplicate.indexOf(row) + 1
        }));
        setData([...data, ...newRows]);
        setSelectedCells(new Set());
        break;
      case 'clearRows':
        setData(prevData => 
          prevData.map(row => {
            if (uniqueRowIds.includes(row.id)) {
              const clearedRow = { ...row };
              Object.keys(clearedRow).forEach(key => {
                if (key !== 'id') {
                  (clearedRow as any)[key] = '';
                }
              });
              return clearedRow;
            }
            return row;
          })
        );
        setSelectedCells(new Set());
        break;
    }
  };

  // Handle cell selection with Ctrl/Shift
  const handleCellSelection = (rowId: number, colIndex: number, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select with Ctrl
      const cellId = `${rowId}-${colIndex}`;
      const newSelectedCells = new Set(selectedCells);
      
      if (newSelectedCells.has(cellId)) {
        newSelectedCells.delete(cellId);
      } else {
        newSelectedCells.add(cellId);
      }
      
      setSelectedCells(newSelectedCells);
      setIsMultiSelect(newSelectedCells.size > 0);
    } else {
      // Single select
      setSelectedCells(new Set());
      setIsMultiSelect(false);
      setSelectedCell({ row: rowId, col: colIndex });
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center space-x-3">
          {(searchTerm || filterField || sortField) && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              {searchTerm && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200 font-medium">
                  Found {searchResultsCount} match{searchResultsCount !== 1 ? 'es' : ''} for "{searchTerm}"
                </span>
              )}
              {filterField && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200 font-medium">
                  Filtered by {filterField}: {filterValue}
                </span>
              )}
              {sortField && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full border border-purple-200 font-medium">
                  Sorted by {sortField} ({sortOrder?.toUpperCase()})
                </span>
              )}
            </div>
          )}
          <div className="text-xs text-gray-500 font-medium">
            View: {cellViewMode} • Showing {processedData.length} of {data.length} rows • {allHeaders.length} columns
          </div>
          {/* Keyboard shortcuts help */}
          <div className="text-xs text-gray-400 border-l border-gray-300 pl-3">
            Shortcuts: Ctrl+Shift+R (Add Row), Ctrl+Shift+C (Add Column), Del (Clear), Shift+Del (Delete Row)
        </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Batch actions */}
          {isMultiSelect && selectedCells.size > 0 && (
            <div className="flex items-center space-x-2 border-r border-gray-300 pr-3">
              <span className="text-xs text-gray-600 font-medium">
                {selectedCells.size} cells selected
              </span>
              <button
                onClick={() => handleBatchAction('deleteRows')}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Delete Rows
              </button>
              <button
                onClick={() => handleBatchAction('duplicateRows')}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Duplicate
              </button>
              <button
                onClick={() => handleBatchAction('clearRows')}
                className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-700 transition-colors font-medium"
              >
                Clear
              </button>
            </div>
          )}
          {selectedCell && !isMultiSelect && (
          <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600 font-medium">
              Selected: Row {selectedCell.row}, Col {selectedCell.col + 1}
            </span>
            <button
              onClick={() => selectedCell && deleteRow(selectedCell.row)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors font-medium"
            >
              Delete Row
            </button>
          </div>
        )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table ref={tableRef} className="w-full border-collapse bg-white">
          <thead>
            {/* Field names header row */}
            <tr className="sticky top-0 z-10">
              <th className={`w-16 ${getCellHeight()} bg-gradient-to-b from-gray-100 to-gray-50 border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-semibold sticky left-0 z-20 relative`}>
                <div className="flex items-center justify-center">
                  <span>#</span>
                </div>
              </th>
              {visibleHeaders.map((header, index) => (
                <th 
                  key={header} 
                  className={`${getCellHeight()} bg-gradient-to-b from-gray-50 to-white border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-semibold px-3 text-left relative hover:bg-gray-100 transition-colors`}
                  style={{width: columnWidths[index] || 160, minWidth: 100}}
                  onContextMenu={(e) => handleContextMenu(e, 'column', undefined, index)}
                >
                  <div className="flex items-center space-x-1">
                    <span className="truncate">{header}</span>
                  </div>
                  {/* Column resize handle */}
                  <div 
                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 hover:opacity-50 transition-colors"
                    onMouseDown={(e) => startColumnResize(index, e)}
                  />
                </th>
              ))}
              {/* Add Column button */}
              <th 
                className={`w-12 ${getCellHeight()} bg-gradient-to-b from-gray-50 to-white border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-semibold px-2 text-center relative`}
              >
                <button
                  onClick={addColumn}
                  className="flex items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                  title="Add new column (Ctrl+Shift+C)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, rowIndex) => {
              const hasRowMatch = visibleFields.some(field => cellMatchesSearch(row, field));
              const rowHeight = getRowHeight(row);
              return (
                <tr key={row.id} className={`group hover:bg-blue-50 transition-colors ${hasRowMatch ? 'bg-yellow-50 border-l-2 border-yellow-400' : ''}`}>
                  {/* Row number */}
                  <td 
                    className={`w-16 ${rowHeight} bg-gradient-to-r from-gray-100 to-gray-50 border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-medium text-center sticky left-0 z-10 relative hover:bg-gray-200 transition-colors`}
                    onContextMenu={(e) => handleContextMenu(e, 'row', rowIndex)}
                  >
                    <div className="flex items-center justify-center h-full">
                    {row.id}
                    </div>
                  </td>
                  
                  {visibleHeaders.map((_, colIndex) => {
                    const isSelected = selectedCell?.row === row.id && selectedCell?.col === colIndex;
                    const isMultiSelected = selectedCells.has(`${row.id}-${colIndex}`);
                    const hasMatch = cellMatchesSearch(row, visibleFields[colIndex]);
                    const cellContent = getCellValue(row.id, colIndex);
                    return (
                      <td 
                        key={colIndex}
                        className={`${rowHeight} border-r border-b border-gray-300 ${getTextSize()} cursor-cell relative transition-all duration-200 ${
                          isSelected ? 'border-2 border-blue-500 bg-blue-50 shadow-sm' : 
                          isMultiSelected ? 'bg-blue-100 border-blue-300' : 'hover:border-blue-300 hover:bg-gray-50'
                        } ${hasMatch ? 'bg-yellow-50' : ''}`}
                        style={{width: columnWidths[colIndex] || 160, minWidth: 100}}
                        onClick={(e) => handleCellSelection(row.id, colIndex, e)}
                        onDoubleClick={() => handleCellDoubleClick(row.id, colIndex)}
                        onContextMenu={(e) => handleContextMenu(e, 'cell', rowIndex, colIndex)}
                      >
                        <div className={`h-full flex ${cellContent.length > 50 ? 'items-start pt-2' : 'items-center'} ${cellViewMode === 'expanded' ? 'items-start pt-2' : ''}`}>
                          {renderCell(row, colIndex)}
                        </div>
                      </td>
                    );
                  })}
                  {/* Add Column cell */}
                  <td 
                    className={`w-12 ${rowHeight} border-r border-b border-gray-300 cursor-default bg-gray-50`}
                  >
                  </td>
                </tr>
              );
            })}
            
            {/* Add Row button row */}
            <tr className="hover:bg-blue-50 transition-colors">
                <td 
                className={`w-16 ${getCellHeight()} bg-gradient-to-r from-gray-100 to-gray-50 border-r border-b border-gray-300 ${getTextSize()} text-gray-700 font-medium text-center sticky left-0 z-10`}
                >
                <button
                  onClick={addRow}
                  className="flex items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200"
                  title="Add new row (Ctrl+Shift+R)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                </td>
              {visibleHeaders.map((_, colIndex) => (
                    <td 
                      key={colIndex}
                  className={`${getCellHeight()} border-r border-b border-gray-300 cursor-default bg-gray-50`}
                  style={{width: columnWidths[colIndex] || 160, minWidth: 100}}
                >
                    </td>
              ))}
              {/* Add Column cell for add row */}
                <td 
                  className={`w-12 ${getCellHeight()} border-r border-b border-gray-300 cursor-default bg-gray-50`}
                >
                </td>
              </tr>
          </tbody>
        </table>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          rowIndex={contextMenu.rowIndex}
          colIndex={contextMenu.colIndex}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}