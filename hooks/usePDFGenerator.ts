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

// Helper to load font file as base64
async function loadFont(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove "data:font/ttf;base64," prefix
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Failed to load font:', url, e);
    return null;
  }
}

// Parse inline styles from element
function parseInlineStyles(el: Element): { fontSize?: number; lineHeight?: number; marginLeft?: number; marginTop?: number; marginBottom?: number; fontFamily?: string } {
  const style = el.getAttribute('style');
  if (!style) return {};

  const result: { fontSize?: number; lineHeight?: number; marginLeft?: number; marginTop?: number; marginBottom?: number; fontFamily?: string } = {};

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

  // Parse margins (assume px) - used for indentation and spacing
  const marginLeftMatch = style.match(/margin-left:\s*(\d+(?:\.\d+)?)(px)?/);
  if (marginLeftMatch) {
    result.marginLeft = parseFloat(marginLeftMatch[1]); // Keep as px for now, convert to mm later
  }

  const marginTopMatch = style.match(/margin-top:\s*(\d+(?:\.\d+)?)em/);
  if (marginTopMatch) {
    // 1em approx 12pt approx 4.2mm
    result.marginTop = parseFloat(marginTopMatch[1]) * 4.2;
  }

  const marginBottomMatch = style.match(/margin-bottom:\s*(\d+(?:\.\d+)?)em/);
  if (marginBottomMatch) {
    result.marginBottom = parseFloat(marginBottomMatch[1]) * 4.2;
  }

  // Parse font-family
  const fontFamilyMatch = style.match(/font-family:\s*['"]?([^;'"]+)['"]?/);
  if (fontFamilyMatch) {
    result.fontFamily = fontFamilyMatch[1];
  }

  return result;
}

// Parse HTML and render to PDF with basic formatting
async function renderHtmlToPdf(
  pdf: jsPDF,
  fullHtml: string,
  startX: number,
  startY: number,
  maxWidth: number,
  imageCache: Map<string, { data: string; width: number; height: number }>
): Promise<void> {
  const PAGE_DELIMITER = '<div class="page-break-delimiter"></div>';
  const pages = fullHtml.split(PAGE_DELIMITER);

  for (let i = 0; i < pages.length; i++) {
    const html = pages[i];
    if (i > 0) {
      pdf.addPage();
    }

    // Reset Y for new page
    let y = startY;

    // Parse this page's content
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const defaultParagraphSpacing = 4;
    const headingSpacing = 8;
    const pxToMm = 0.264583; // 1px = 0.264583mm

    // Helper to process nodes recursively
    const processNode = async (node: Node, inheritedLineHeight: number = 1.0, inheritedMarginLeft: number = 0, inheritedFontFamily: string = 'helvetica'): Promise<void> => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          const currentFontSize = 12;
          const lineHeightFactor = inheritedLineHeight === 1.0 ? 1.5 : inheritedLineHeight;
          const fontSizeMm = currentFontSize * 0.352778;
          const currentLineHeight = fontSizeMm * lineHeightFactor;

          // Calculate available width based on indentation
          const currentX = startX + inheritedMarginLeft;
          const currentMaxWidth = maxWidth - inheritedMarginLeft;

          // Apply Font
          if (inheritedFontFamily === 'Omni BSIC') {
            pdf.setFont('OmniBSIC', 'normal');
          } else if (inheritedFontFamily === 'Omni BSIC Black') {
            pdf.setFont('OmniBSIC-Black', 'normal');
          } else {
            // Let standard logic handle generic fonts (which might be bold/italic)
            // We only explicitly set custom fonts here if needed, otherwise parent logic sets it
            if (inheritedFontFamily !== 'helvetica') {
              // Future custom fonts
            }
          }

          const lines = pdf.splitTextToSize(text, currentMaxWidth);
          lines.forEach((line: string) => {
            if (y + currentLineHeight > 277) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(line, currentX, y);
            y += currentLineHeight;
          });
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as Element;
      const tagName = el.tagName.toLowerCase();

      const inlineStyles = parseInlineStyles(el);
      const customFontSize = inlineStyles.fontSize;
      const customLineHeight = inlineStyles.lineHeight || inheritedLineHeight;

      // Calculate margins/indentation
      const elementMarginLeft = (inlineStyles.marginLeft || 0) * pxToMm;
      const currentMarginLeft = inheritedMarginLeft + elementMarginLeft;

      // Apply Top Margin/Spacing
      if (inlineStyles.marginTop) {
        y += inlineStyles.marginTop;
      }

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
        case 'p':
          // Standard paragraph spacing + custom top margin
          y += defaultParagraphSpacing;
          pdf.setFontSize(customFontSize || 12);
          pdf.setFont('helvetica', 'normal');
          break;
        case 'br':
          const brHeight = (customFontSize || 12) * 0.352778 * 1.5;
          y += brHeight;
          return;
        case 'hr':
          y += 5;
          pdf.setDrawColor(200);
          pdf.line(startX, y, startX + maxWidth, y);
          y += 5;
          return;
        case 'ul':
        case 'ol':
          y += defaultParagraphSpacing / 2;
          break;
        case 'li':
          const bullet = el.parentElement?.tagName.toLowerCase() === 'ol'
            ? `${Array.from(el.parentElement.children).indexOf(el) + 1}. `
            : '• ';

          let listIndent = 5; // Basic indent for bullets
          // If parent is OL/UL, it might have its own indent, effectively handled by recursion logic if we structured it that way.
          // For now, assume list items are just indented slightly from current margin.

          const currentX = startX + currentMarginLeft + listIndent;
          const currentMaxWidth = maxWidth - currentMarginLeft - listIndent;

          const liText = htmlToPlainText(el.innerHTML);
          const liLines = pdf.splitTextToSize(liText, currentMaxWidth - 5); // Extra 5 for bullet space

          liLines.forEach((line: string, idx: number) => {
            if (y + ((customFontSize || 12) * 0.352778 * 1.5) > 277) {
              pdf.addPage();
              y = 20;
            }
            if (idx === 0) {
              pdf.text(bullet, currentX - 5, y); // Draw bullet to left
            }
            pdf.text(line, currentX, y);
            y += ((customFontSize || 12) * 0.352778 * 1.5);
          });
          return;
        case 'blockquote':
          // Blockquote logic
          // .. omitted complex logic, but handle indentation
          const bqMargin = 10;
          const bqX = startX + currentMarginLeft + bqMargin;
          const bqText = htmlToPlainText(el.innerHTML);
          pdf.text(bqText, bqX, y);
          y += defaultParagraphSpacing;
          return;
        case 'img':
          const src = el.getAttribute('src');
          if (src && imageCache.has(src)) {
            const imgData = imageCache.get(src)!; /* pxToMm defined above */
            let imgWidthMm = imgData.width * pxToMm;
            let imgHeightMm = imgData.height * pxToMm;

            if (imgWidthMm > maxWidth) {
              const scale = maxWidth / imgWidthMm;
              imgWidthMm = maxWidth;
              imgHeightMm *= scale;
            }
            const maxImgHeight = 120; // Constraint
            if (imgHeightMm > maxImgHeight) {
              const scale = maxImgHeight / imgHeightMm;
              imgHeightMm = maxImgHeight;
              imgWidthMm *= scale;
            }

            if (y + imgHeightMm + 5 > 277) {
              pdf.addPage();
              y = 20;
            }

            // Respect alignment if present
            let imgX = startX + currentMarginLeft;
            // ... (alignment logic is usually style based, which we aren't fully parsing for alignment yet, 
            // but the original code had basic left/center/right via parent styles logic which we might need to restore if lost)
            // For now, defaulting to basic left relative to indentation.

            try {
              pdf.addImage(imgData.data, 'JPEG', imgX, y, imgWidthMm, imgHeightMm);
              y += imgHeightMm + defaultParagraphSpacing;
            } catch (e) {
              console.error('Failed to add image to PDF:', e);
            }
          }
          return;
      }

      for (const child of Array.from(node.childNodes)) {
        await processNode(child, customLineHeight, currentMarginLeft, customFontFamily);
      }

      // Resets
      if (['h1', 'h2', 'h3', 'p', 'strong', 'b', 'em', 'i'].includes(tagName)) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
      }

      // Bottom Spacing (Margin Bottom or default block spacing)
      if (inlineStyles.marginBottom) {
        y += inlineStyles.marginBottom;
      } else if (['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'blockquote'].includes(tagName)) {
        y += defaultParagraphSpacing;
      }
    };

    // Process this page's body
    for (const child of Array.from(doc.body.childNodes)) {
      await processNode(child);
    }
  }
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

    // Load Fonts
    const fontOmni = await loadFont('/fonts/OmniBSIC.ttf');
    const fontOmniBlack = await loadFont('/fonts/OmniBSIC-Black.ttf');

    // Create PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    // Register Fonts
    if (fontOmni) {
      pdf.addFileToVFS('OmniBSIC.ttf', fontOmni);
      pdf.addFont('OmniBSIC.ttf', 'OmniBSIC', 'normal');
    }
    if (fontOmniBlack) {
      pdf.addFileToVFS('OmniBSIC-Black.ttf', fontOmniBlack);
      pdf.addFont('OmniBSIC-Black.ttf', 'OmniBSIC-Black', 'normal');
    }

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
