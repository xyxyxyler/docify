'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { replaceVariables } from '@/lib/utils';
import type { RowData } from '@/types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateHtml: string;
  data: RowData[];
  emailColumn?: string | null;
}

export default function PreviewModal({
  isOpen,
  onClose,
  templateHtml,
  data,
  emailColumn,
}: PreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || data.length === 0) return null;

  const currentRow = data[currentIndex];
  const previewHtml = replaceVariables(templateHtml, currentRow);
  const recipientEmail = emailColumn ? currentRow[emailColumn] : null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : data.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < data.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Document Preview</h2>
            <p className="text-sm text-gray-500">
              Preview how your document will look with actual data
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b">
          <button
            onClick={goToPrevious}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              Record {currentIndex + 1} of {data.length}
            </span>
            {recipientEmail && (
              <span className="text-sm text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                📧 {recipientEmail}
              </span>
            )}
          </div>

          <button
            onClick={goToNext}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="mx-auto bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm', padding: '20mm' }}>
            <div
              className="prose max-w-none preview-content"
              style={{
                whiteSpace: 'pre-wrap',
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <style jsx global>{`
              .preview-content p:empty {
                min-height: 1.5em;
              }
              .preview-content p {
                margin-bottom: 1em;
              }
              .preview-content br {
                display: block;
                content: "";
                margin-top: 0.5em;
              }
            `}</style>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Use arrows to navigate between records
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
