'use client';

import { useState } from 'react';
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
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data loaded. Upload a file to get started.
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const handleCellClick = (rowIndex: number, columnKey: string, currentValue: any) => {
    setEditingCell({ row: rowIndex, col: columnKey });
    setEditValue(String(currentValue || ''));
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const newRows = [...rows];
      newRows[editingCell.row][editingCell.col] = editValue;
      setRows(newRows);
      onDataChange(newRows);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();

    const menu = document.createElement('div');
    menu.className = 'fixed bg-white shadow-lg rounded-lg border border-gray-200 p-2 z-50';
    menu.style.left = `${e.clientX}px`;
    menu.style.top = `${e.clientY}px`;

    const option = document.createElement('button');
    option.className = 'block w-full text-left px-4 py-2 hover:bg-gray-100 rounded text-sm';
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

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 text-sm text-gray-600">
        Right-click on a column header to set it as the email recipient field
      </div>
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  onContextMenu={(e) => handleHeaderContextMenu(e, col)}
                  className="border-b border-r border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {col} {emailColumn === col && '📧'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => {
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === col;
                  const cellValue = row[col];

                  return (
                    <td
                      key={col}
                      className="border-b border-r border-gray-200 px-4 py-2 text-sm text-gray-900"
                      onClick={() => !isEditing && handleCellClick(rowIndex, col, cellValue)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          autoFocus
                          className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="cursor-pointer">{String(cellValue || '')}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
