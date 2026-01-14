'use client';

import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { RowData } from '@/types';

interface FileUploaderProps {
  onDataLoaded: (data: RowData[]) => void;
}

export default function FileUploader({ onDataLoaded }: FileUploaderProps) {
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as RowData[];
        
        onDataLoaded(jsonData);
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error reading file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    
    reader.readAsBinaryString(file);
  }, [onDataLoaded]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition cursor-pointer"
    >
      <input
        type="file"
        id="file-upload"
        accept=".xlsx,.xls,.csv"
        onChange={handleChange}
        className="hidden"
      />
      <label htmlFor="file-upload" className="cursor-pointer">
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Drop your file here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports Excel (.xlsx, .xls) and CSV files
        </p>
      </label>
    </div>
  );
}
