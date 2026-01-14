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
// Custom Header Renderer to gain full control over styling
// This component fills the RDG cell completely
const HeaderRenderer = ({ column, emailColumn, onContextMenu }: any) => {
  return (
    <div
      className="w-full h-full flex items-center px-4 bg-gray-100 font-semibold text-gray-700 select-none"
      onContextMenu={(e) => onContextMenu(e, column.key)}
      title={column.originalName}
    >
      <span className="truncate flex-1">
        {column.originalName}
      </span>
      {emailColumn === column.key && <span className="ml-2 flex-shrink-0">📧</span>}
    </div>
  );
};

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
      // Calculate width (generous 12px per char + 60px padding)
      const calculatedWidth = Math.max(160, key.length * 12 + 60);

      return {
        key,
        name: key,
        originalName: key,
        editable: true,
        resizable: true,
        width: calculatedWidth,
        // Header Renderer handles specific styling (bg, color, alignment)
        headerRenderer: (props: any) => (
          <HeaderRenderer
            column={{ ...props.column, originalName: key }}
            emailColumn={emailColumn}
            onContextMenu={handleContextMenu}
          />
        )
      };
    });
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
          columns={columns}
          rows={rows}
          onRowsChange={handleRowsChange}
          className="rdg-light h-full"
        />
      </div>
    </div>
  );
}
