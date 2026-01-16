'use client';

import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { RowData, PDFGenerationOptions } from '@/types';
import { replaceVariables } from '@/lib/utils';

export function usePDFGenerator() {
  const generatePDF = useCallback(async (
    row: RowData,
    templateHtml: string,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> => {
    const { format = 'a4', orientation = 'portrait' } = options;

    // Replace variables in template
    const filledHtml = replaceVariables(templateHtml, row);

    // Split content into pages
    const PAGE_DELIMITER = '<div class="page-break-delimiter"></div>';
    const pages = filledHtml.split(PAGE_DELIMITER);

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    // Create a temporary container for rendering
    // We must append it to the body to ensure it can access loaded fonts and styles
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    // Match the A4 dimensions exactly (210mm x 297mm approx 794px x 1123px at 96DPI)
    // We use a slightly larger width to ensure no wrapping issues, or match the editor's width.
    // The .a4-page class in global css is 210mm width.
    container.style.width = '210mm';
    // container.style.height = '297mm'; // Let height track content? No, forced page size.
    document.body.appendChild(container);

    try {
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();

        // Prepare the page content
        // We inject styles to hide UI indicators (like the red page end line and placeholders)
        container.innerHTML = `
          <style>
            .a4-page::after { display: none !important; content: none !important; }
            .ProseMirror p.is-editor-empty::before { content: none !important; }
          </style>
          <div class="a4-page" style="margin: 0; padding: 20mm; overflow: hidden; height: 297mm; box-shadow: none; border: none; background: white;">
            <div class="ProseMirror" style="height: 100%; outline: none;">
              ${pages[i]}
            </div>
          </div>
        `;

        // Wait for fonts to be ready (optional but recommended)
        await document.fonts.ready;

        // Wait a tick for images to load? html2canvas has useCORS option.
        // If images rely on external URLs, useCORS: true is vital.

        const canvas = await html2canvas(container, {
          scale: 2, // Higher scale for better quality (2 is usually good enough for print 150-200dpi equivalent)
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794, // Approx 210mm at 96dpi
          windowHeight: 1123, // Approx 297mm at 96dpi
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = pdf.getImageProperties(imgData);

        // Calculate dimensions to fit PDF page exactly
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Clean up
      document.body.removeChild(container);
    }

    return pdf.output('blob');
  }, []);

  const generateMultiplePDFs = useCallback(async (
    rows: RowData[],
    templateHtml: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob[]> => {
    const blobs: Blob[] = [];

    for (let i = 0; i < rows.length; i++) {
      const blob = await generatePDF(rows[i], templateHtml);
      blobs.push(blob);
      if (onProgress) {
        onProgress(i + 1, rows.length);
      }
    }

    return blobs;
  }, [generatePDF]);

  return {
    generatePDF,
    generateMultiplePDFs,
  };
}
