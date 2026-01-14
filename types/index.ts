// Type definitions for Docify

export interface RowData {
  [key: string]: string | number | boolean | null;
}

export interface Template {
  id?: string;
  name: string;
  htmlContent: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id?: string;
  userId: string;
  name: string;
  gridData: RowData[];
  template: Template;
  emailColumn?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailDispatchStatus {
  rowIndex: number;
  email: string;
  status: 'pending' | 'sending' | 'sent' | 'error';
  error?: string;
}

export interface PDFGenerationOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export interface SupabaseProject {
  id: string;
  user_id: string;
  name: string;
  grid_data: RowData[];
  template_html: string;
  template_name: string;
  email_column: string | null;
  created_at: string;
  updated_at: string;
}

export type ViewMode = 'data' | 'editor' | 'split';
