'use client';

import { useCallback } from 'react';
import jsPDF from 'jspdf';
import type { RowData, PDFGenerationOptions } from '@/types';
import { replaceVariables } from '@/lib/utils';

// Helper to strip HTML tags and decode entities
function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// Helper to load image and get dimensions
async function loadImage(src: string): Promise<{ data: string; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Fill with white background first (fixes PNG transparency issue)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw image on top of white background
      ctx.drawImage(img, 0, 0);

      // Always output as JPEG to avoid transparency issues and reduce file size
      const data = canvas.toDataURL('image/jpeg', 0.9);

      resolve({
        data,
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Collect all images from HTML for async loading
function collectImages(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img');
  const srcs: string[] = [];
  images.forEach(img => {
    const src = img.getAttribute('src');
    if (src) srcs.push(src);
  });
  return srcs;
}

// Parse inline styles from element
function parseInlineStyles(el: Element): { fontSize?: number; lineHeight?: number } {
  const style = el.getAttribute('style');
  if (!style) return {};

  const result: { fontSize?: number; lineHeight?: number } = {};

  // Parse font-size (supports pt and px)
  const fontSizeMatch = style.match(/font-size:\s*(\d+(?:\.\d+)?)(pt|px)/);
  if (fontSizeMatch) {
    const value = parseFloat(fontSizeMatch[1]);
    const unit = fontSizeMatch[2];
    // Convert px to pt if needed (1pt = 1.333px at 96 DPI)
    result.fontSize = unit === 'px' ? value * 0.75 : value;
  }

  // Parse line-height (unitless multiplier)
  const lineHeightMatch = style.match(/line-height:\s*(\d+(?:\.\d+)?)/);
  if (lineHeightMatch) {
    result.lineHeight = parseFloat(lineHeightMatch[1]);
  }

  return result;
}

// Parse HTML and render to PDF with basic formatting
async function renderHtmlToPdf(
  pdf: jsPDF,
  html: string,
  startX: number,
  startY: number,
  maxWidth: number,
  imageCache: Map<string, { data: string; width: number; height: number }>
): Promise<number> {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let y = startY;
  const baseLineHeight = 7;
  const paragraphSpacing = 4;
  const headingSpacing = 8;

  async function processNode(node: Node, inheritedLineHeight: number = 1.0): Promise<void> {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        const currentLineHeight = baseLineHeight * inheritedLineHeight;
        const lines = pdf.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          // Check BEFORE adding content if we need a new page
          if (y + currentLineHeight > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, startX, y);
          y += currentLineHeight;
        });
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as Element;
    const tagName = el.tagName.toLowerCase();

    // Parse inline styles
    const inlineStyles = parseInlineStyles(el);
    const customFontSize = inlineStyles.fontSize;
    const customLineHeight = inlineStyles.lineHeight || inheritedLineHeight;

    // Handle different elements
    switch (tagName) {
      case 'h1':
        y += headingSpacing;
        pdf.setFontSize(customFontSize || 24);
        pdf.setFont('helvetica', 'bold');
        break;
      case 'h2':
        y += headingSpacing;
        pdf.setFontSize(customFontSize || 18);
        pdf.setFont('helvetica', 'bold');
        break;
      case 'h3':
        y += headingSpacing / 2;
        pdf.setFontSize(customFontSize || 14);
        pdf.setFont('helvetica', 'bold');
        break;
      case 'strong':
      case 'b':
        pdf.setFont('helvetica', 'bold');
        if (customFontSize) pdf.setFontSize(customFontSize);
        break;
      case 'em':
      case 'i':
        pdf.setFont('helvetica', 'italic');
        if (customFontSize) pdf.setFontSize(customFontSize);
        break;
      case 'u':
        // Underline handled separately
        if (customFontSize) pdf.setFontSize(customFontSize);
        break;
      case 'p':
        y += paragraphSpacing;
        pdf.setFontSize(customFontSize || 12);
        pdf.setFont('helvetica', 'normal');
        break;
      case 'br':
        y += baseLineHeight;
        return;
      case 'hr':
        y += 5;
        pdf.setDrawColor(200);
        pdf.line(startX, y, startX + maxWidth, y);
        y += 5;
        return;
      case 'ul':
      case 'ol':
        y += paragraphSpacing / 2;
        break;
      case 'li':
        const bullet = el.parentElement?.tagName.toLowerCase() === 'ol'
          ? `${Array.from(el.parentElement.children).indexOf(el) + 1}. `
          : '• ';
        const liText = htmlToPlainText(el.innerHTML);
        const liLines = pdf.splitTextToSize(liText, maxWidth - 10);
        liLines.forEach((line: string, idx: number) => {
          // Check BEFORE adding content if we need a new page
          if (y + baseLineHeight > 270) {
            pdf.addPage();
            y = 20;
          }
          if (idx === 0) {
            pdf.text(bullet, startX, y);
          }
          pdf.text(line, startX + 8, y);
          y += baseLineHeight;
        });
        return; // Don't process children, we handled the text
      case 'blockquote':
        pdf.setTextColor(100);
        const bqText = htmlToPlainText(el.innerHTML);
        const bqLines = pdf.splitTextToSize(bqText, maxWidth - 10);
        bqLines.forEach((line: string, idx: number) => {
          // Check BEFORE adding content if we need a new page
          if (y + baseLineHeight > 270) {
            pdf.addPage();
            y = 20;
          }
          if (idx === 0 || y === 20) {
            pdf.text('|', startX, y);
          }
          pdf.text(line, startX + 5, y);
          y += baseLineHeight;
        });
        pdf.setTextColor(0);
        y += paragraphSpacing;
        return;
      case 'img':
        const src = el.getAttribute('src');
        if (src && imageCache.has(src)) {
          const imgData = imageCache.get(src)!;

          // Calculate dimensions to fit within maxWidth
          // Convert pixels to mm (assuming 96 DPI: 1 inch = 25.4mm, 96px = 25.4mm)
          const pxToMm = 25.4 / 96;
          let imgWidthMm = imgData.width * pxToMm;
          let imgHeightMm = imgData.height * pxToMm;

          // Scale down if too wide
          if (imgWidthMm > maxWidth) {
            const scale = maxWidth / imgWidthMm;
            imgWidthMm = maxWidth;
            imgHeightMm *= scale;
          }

          // Max height constraint (half page)
          const maxHeight = 120;
          if (imgHeightMm > maxHeight) {
            const scale = maxHeight / imgHeightMm;
            imgHeightMm = maxHeight;
            imgWidthMm *= scale;
          }

          // Check BEFORE adding image if it fits on current page
          // Add small buffer (5mm) to ensure image doesn't touch bottom margin
          if (y + imgHeightMm + 5 > 270) {
            pdf.addPage();
            y = 20;
          }

          // Add image to PDF (always JPEG since we convert in loadImage)
          try {
            pdf.addImage(imgData.data, 'JPEG', startX, y, imgWidthMm, imgHeightMm);
            y += imgHeightMm + paragraphSpacing;
          } catch (e) {
            console.error('Failed to add image to PDF:', e);
          }
        }
        return;
    }

    // Process children
    for (const child of Array.from(node.childNodes)) {
      await processNode(child);
    }

    // Reset after certain elements
    if (['h1', 'h2', 'h3', 'p', 'strong', 'b', 'em', 'i'].includes(tagName)) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
    }

    if (['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'blockquote'].includes(tagName)) {
      y += paragraphSpacing;
    }
  }

  // Process body content
  for (const child of Array.from(doc.body.childNodes)) {
    await processNode(child);
  }

  return y;
}

export function usePDFGenerator() {
  const generatePDF = useCallback(async (
    row: RowData,
    templateHtml: string,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> => {
    const { format = 'a4', orientation = 'portrait' } = options;

    // Replace variables in template with row data
    const filledHtml = replaceVariables(templateHtml, row);

    // Pre-load all images
    const imageSrcs = collectImages(filledHtml);
    const imageCache = new Map<string, { data: string; width: number; height: number }>();

    for (const src of imageSrcs) {
      const imgData = await loadImage(src);
      if (imgData) {
        imageCache.set(src, imgData);
      }
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    // Set default font
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    // Render HTML content to PDF
    const margin = 20;
    const contentWidth = (format === 'a4' ? 210 : 216) - (margin * 2);

    await renderHtmlToPdf(pdf, filledHtml, margin, margin, contentWidth, imageCache);

    // Return as blob
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
