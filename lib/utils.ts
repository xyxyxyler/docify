import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RowData } from '@/types';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sleep utility for throttling operations
 * @param ms - milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Replace variables in template HTML with actual data from a row
 * Variables are in the format {VariableName}
 * @param template - HTML template string
 * @param data - Row data object
 */
export function replaceVariables(template: string, data: RowData): string {
  let result = template;
  
  // Replace {VariableName} format
  const variableRegex = /\{([^{}]+)\}/g;
  result = result.replace(variableRegex, (match, variableName) => {
    const trimmedName = variableName.trim();
    const value = data[trimmedName];
    return value !== undefined && value !== null ? String(value) : match;
  });
  
  return result;
}

/**
 * Extract variable names from a template
 * Variables are in the format {VariableName}
 * @param template - HTML template string
 * @returns Array of variable names
 */
export function extractVariables(template: string): string[] {
  const variables: string[] = [];
  const variableRegex = /\{([^{}]+)\}/g;
  let match;
  
  while ((match = variableRegex.exec(template)) !== null) {
    const variableName = match[1].trim();
    if (!variables.includes(variableName)) {
      variables.push(variableName);
    }
  }
  
  return variables;
}

/**
 * Validate that all variables in template exist in the data columns
 * @param template - HTML template string
 * @param columns - Available column names from data
 * @returns Object with validation result and missing variables
 */
export function validateTemplate(
  template: string,
  columns: string[]
): { isValid: boolean; missingVariables: string[] } {
  const templateVariables = extractVariables(template);
  const missingVariables = templateVariables.filter(
    variable => !columns.includes(variable)
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate a filename from row data
 * @param row - Row data
 * @param pattern - Pattern with variables (e.g., "{{Name}}_{{ID}}.pdf")
 * @returns Generated filename
 * @deprecated Use generateSafeFilename instead
 */
export function generateFilename(row: RowData, pattern: string): string {
  const filename = replaceVariables(pattern, row);
  // Remove any invalid filename characters
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_');
}

/**
 * Generate a safe filename from row data using a pattern
 * @param row - Row data
 * @param pattern - Pattern with variables (e.g., "{Name}_{ID}")
 * @param fallbackPrefix - Prefix to use if pattern produces empty result
 * @param index - Row index for fallback (0-based)
 * @returns Safe filename with .pdf extension
 */
export function generateSafeFilename(
  row: RowData, 
  pattern: string,
  fallbackPrefix: string = 'document',
  index: number = 0
): string {
  // Replace variables in pattern
  let filename = replaceVariables(pattern, row);
  
  // Check if any unreplaced variables remain (e.g., {NonExistentColumn})
  const hasUnreplacedVars = /\{[^}]+\}/.test(filename);
  
  // If pattern resulted in empty string or still has unreplaced variables, use fallback
  if (!filename || hasUnreplacedVars || filename.trim() === '') {
    filename = `${fallbackPrefix}_${String(index + 1).padStart(4, '0')}`;
  }
  
  // Sanitize filename:
  // 1. Remove leading/trailing spaces
  // 2. Replace multiple spaces with single space
  // 3. Remove invalid filesystem characters (keep alphanumeric, spaces, hyphens, underscores, dots, @)
  // 4. Replace spaces with underscores
  filename = filename
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s/g, '_');
  
  // Ensure filename isn't too long (max 200 chars before .pdf)
  if (filename.length > 200) {
    filename = filename.substring(0, 200);
  }
  
  // Remove trailing dots or spaces (not allowed on Windows)
  filename = filename.replace(/[.\s]+$/, '');
  
  // Ensure we have something
  if (!filename) {
    filename = `${fallbackPrefix}_${String(index + 1).padStart(4, '0')}`;
  }
  
  // Add .pdf extension
  return `${filename}.pdf`;
}

/**
 * Sanitize HTML content to prevent XSS
 * Note: This is a basic implementation. For production, use a library like DOMPurify
 * @param html - HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format date to locale string
 * @param date - Date object or string
 * @returns Formatted date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
