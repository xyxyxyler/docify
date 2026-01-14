'use client';

import { useMemo, useState } from 'react';
import DataGrid from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import type { RowData } from '@/types';


interface DataGridViewProps {
  data: RowData[];
  onDataChange: (data: RowData[]) => void;
  onSetEmailColumn: (columnKey: string) => void;
  emailColumn?: string;
}

export default function DataGridView({
  data,
  onDataChange,
  onSetEmailColumn,
  emailColumn
}: DataGridViewProps) {
  const [rows, setRows] = useState(data);

  const columns = useMemo(() => {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    return keys.map((key) => {
      // More generous width calculation
      const calculatedWidth = Math.max(150, key.length * 10 + 100);

      return {
        key,
        name: emailColumn === key ? `${key} 📧` : key,
        editable: true,
        resizable: true,
        width: calculatedWidth,
        headerCellClass: 'rdg-header-cell-custom',
        cellClass: 'rdg-cell-custom'
      };
    });
  }, [data, emailColumn]);

  const handleRowsChange = (newRows: RowData[]) => {
    setRows(newRows);
    onDataChange(newRows);
  };

  const handleHeaderContextMenu = (e: React.MouseEvent) => {
    // Find the column header that was clicked
    const target = e.target as HTMLElement;
    const headerCell = target.closest('.rdg-cell');
    if (!headerCell) return;

    const columnIndex = Array.from(headerCell.parentElement?.children || []).indexOf(headerCell);
    if (columnIndex === -1) return;

    const keys = Object.keys(data[0]);
    const columnKey = keys[columnIndex];
    if (!columnKey) return;

    e.preventDefault();

    const menu = document.createElement('div');
    menu.className = 'fixed bg-white shadow-lg rounded-lg border p-2 z-50';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const option = document.createElement('button');
    option.className = 'block w-full text-left px-4 py-2 hover:bg-gray-100 rounded';
    option.textContent = emailColumn === columnKey ? 'Remove as Email Column' : 'Set as Email Column';
    option.onclick = () => {
      onSetEmailColumn(emailColumn === columnKey ? '' : columnKey);
      menu.remove();
    };

    menu.appendChild(option);
    document.body.appendChild(menu);

    const removeMenu = () => {
      menu.remove();
      document.removeEventListener('click', removeMenu);
    };

    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 0);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data loaded. Upload a file to get started.
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-2 text-sm text-gray-600">
        Right-click on a column header to set it as the email recipient field
      </div>
      <div className="h-[calc(100%-2rem)]" onContextMenu={handleHeaderContextMenu}>
        <DataGrid
          columns={columns}
          rows={rows}
          onRowsChange={handleRowsChange}
          className="rdg-light h-full"
        />
      </div>
    </div>
  );
}
