'use client';

import { useState, useCallback } from 'react';
import type { RowData } from '@/types';

export function useDataGrid(initialData: RowData[] = []) {
  const [data, setData] = useState<RowData[]>(initialData);
  const [emailColumn, setEmailColumn] = useState<string | undefined>(undefined);

  const updateData = useCallback((newData: RowData[]) => {
    setData(newData);
  }, []);

  const updateEmailColumn = useCallback((columnKey: string) => {
    setEmailColumn(columnKey);
  }, []);

  const getColumnHeaders = useCallback((): string[] => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const addRow = useCallback(() => {
    if (data.length === 0) return;
    
    const newRow: RowData = {};
    Object.keys(data[0]).forEach(key => {
      newRow[key] = '';
    });
    setData([...data, newRow]);
  }, [data]);

  const removeRow = useCallback((index: number) => {
    setData(data.filter((_, i) => i !== index));
  }, [data]);

  return {
    data,
    emailColumn,
    updateData,
    updateEmailColumn,
    getColumnHeaders,
    addRow,
    removeRow,
  };
}
