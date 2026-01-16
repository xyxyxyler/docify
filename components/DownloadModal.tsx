'use client';

import { useState } from 'react';
import { X, Download, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { useWordGenerator } from '@/hooks/useWordGenerator';
import { replaceVariables, generateSafeFilename } from '@/lib/utils';
import type { RowData } from '@/types';
import JSZip from 'jszip';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateHtml: string;
  data: RowData[];
  projectName: string;
  filenamePattern?: string; // Pattern for generating filenames (e.g., "{Name}_{ID}")
}

type DownloadStatus = 'idle' | 'generating' | 'complete' | 'error';

export default function DownloadModal({
  isOpen,
  onClose,
  templateHtml,
  data,
  projectName,
  filenamePattern = '{Name}', // Default pattern
}: DownloadModalProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [errorMessage, setErrorMessage] = useState('');
  const { generatePDF } = usePDFGenerator();
  const { generateWord } = useWordGenerator();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleWordDownload = async (row: RowData) => {
    const filenameSource = row[Object.keys(row)[0]] || 'document';
    const filename = `${filenameSource}.docx`;
    await generateWord(row, templateHtml, filename);
  };

  if (!isOpen) return null;

  const getFilenameForRow = (row: RowData, index: number): string => {
    return generateSafeFilename(row, filenamePattern, projectName, index);
  };

  const handleDownloadAll = async (format: 'pdf' | 'word') => {
    setStatus('generating');
    setProgress({ current: 0, total: data.length });
    setErrorMessage('');

    try {
      const zip = new JSZip();

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const baseFilename = getFilenameForRow(row, i);

        if (format === 'pdf') {
          const blob = await generatePDF(row, templateHtml);
          zip.file(`${baseFilename}.pdf`, blob);
        } else {
          // Generate Word Blob
          // Re-use logic from hooks but we need the raw blob here, hook downloads it.
          // Let's call API directly here for simplicity or refactor hook to return blob.
          // Calling API directly is cleaner for "bulk" op inside modal.
          const filledHtml = replaceVariables(templateHtml, row);
          const response = await fetch('/api/generate-word', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html: filledHtml, filename: `${baseFilename}.docx` }),
          });
          if (!response.ok) throw new Error('Failed to generate Word doc');
          const blob = await response.blob();
          zip.file(`${baseFilename}.docx`, blob);
        }

        setProgress({ current: i + 1, total: data.length });
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}_${format === 'pdf' ? 'documents' : 'word_docs'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('complete');
    } catch (error) {
      console.error('Generation error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate files');
      setStatus('error');
    }
  };

  const handleDownloadSingle = async (index: number) => {
    const row = data[index];
    try {
      const blob = await generatePDF(row, templateHtml);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFilenameForRow(row, index);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleClose = () => {
    if (status !== 'generating') {
      setStatus('idle');
      setProgress({ current: 0, total: 0 });
      onClose();
    }
  };

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Download Documents</h2>
              <p className="text-sm text-gray-500">{data.length} documents ready</p>
            </div>
          </div>
          {status !== 'generating' && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <>
              <div className="mb-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDownloadAll('pdf')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  <Download className="w-5 h-5" />
                  Download ZIP (PDF)
                </button>
                <button
                  onClick={() => handleDownloadAll('word')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <FileText className="w-5 h-5" />
                  Download ZIP (Word)
                </button>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Or download individually:</h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {data.map((row, index) => (
                    <div
                      key={index}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">
                          {getFilenameForRow(row, index)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleWordDownload(row)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Download Word"
                        >
                          <span className="text-xs font-bold px-1 border border-blue-600 rounded">DOCX</span>
                        </button>
                        <button
                          onClick={() => handleDownloadSingle(index)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {status === 'generating' && (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Generating documents...
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {progress.current} of {progress.total} complete
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="py-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Download Complete!
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {data.length} documents have been downloaded as a ZIP file.
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Generation Failed
              </p>
              <p className="text-sm text-red-600 mb-4">
                {errorMessage}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
