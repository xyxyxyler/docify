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
    return keys.map((key) => ({
      key,
      name: key + (emailColumn === key ? ' 📧' : ''),
      editable: true,
      resizable: true,
      minWidth: 150, // Ensure full header text is visible
    }));
  }, [data, emailColumn]);

  const handleRowsChange = (newRows: RowData[]) => {
    setRows(newRows);
    onDataChange(newRows);
  };

  const handleContextMenu = (e: React.MouseEvent, columnKey: string) => {
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
      <div className="h-[calc(100%-2rem)]">
        <DataGrid
          columns={columns.map(col => ({
            ...col,
            headerCellClass: 'cursor-context-menu',
            headerRenderer: (props: any) => (
              <div
                onContextMenu={(e) => handleContextMenu(e, col.key)}
                className="flex items-center h-full px-2"
                title={col.name}
              >
                <span className="truncate">{props.column.name}</span>
              </div>
            ),
          }))}
          rows={rows}
          onRowsChange={handleRowsChange}
          className="rdg-light h-full"
        />
      </div>
    </div>
  );
}
