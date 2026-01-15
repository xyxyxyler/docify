'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  const [pages, setPages] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentRow = data.length > 0 ? data[currentIndex] : null;
  const previewHtml = useMemo(() => {
    return currentRow ? replaceVariables(templateHtml, currentRow) : '';
  }, [templateHtml, currentRow]);

  const recipientEmail = emailColumn && currentRow ? currentRow[emailColumn] : null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : data.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < data.length - 1 ? prev + 1 : 0));
  };

  // Split content into pages
  useEffect(() => {
    if (!isOpen || !previewHtml) {
      if (pages.length > 0) {
        setPages([]);
      }
      return;
    }

    const PAGE_DELIMITER = '<div class="page-break-delimiter"></div>';

    if (previewHtml.includes('page-break-delimiter')) {
      // Explicit pages from new editor
      setPages(previewHtml.split(PAGE_DELIMITER));
    } else {
      // Legacy support or fallback: Treat as single page
      setPages([previewHtml]);
    }

  }, [previewHtml, isOpen]);

  if (!isOpen || data.length === 0) return null;

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
            {pages.length > 1 && (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'}
              </span>
            )}
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
          <div ref={contentRef} className="mx-auto">
            {pages.map((pageContent, index) => (
              <div
                key={index}
                className="bg-white page-container"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  maxHeight: '297mm',
                  padding: '20mm',
                  overflow: 'hidden',
                  pageBreakAfter: 'always',
                  marginBottom: index < pages.length - 1 ? '10mm' : '0', // 10mm gap to match editor
                  // Prominent Word-style layered shadows for 3D effect - matching editor
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  border: '1px solid #d1d5db' // gray-300
                }}
              >
                <div
                  className="prose max-w-none preview-content"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              </div>
            ))}
          </div>
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
            .preview-content * {
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            
            /* Page break styles for print and preview */
            @media print {
              .page-container {
                page-break-after: always;
                height: 297mm;
                overflow: visible;
              }
            }
          `}</style>
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
