

export enum FileStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Processing = 'processing',
  Success = 'success',
  Error = 'error',
}

export interface FileWithStatus {
  file: File;
  status: FileStatus;
  progress: number;
  pageCount?: number;
  selectedPages?: number[]; // Array of 1-based page numbers
  errorReason?: string;
}

export interface Qty {
  raw: string;
  unit: "m" | "ft" | "in" | "unknown";
  value: number | null;
}

export interface BOMItem {
  id: string;
  ITEM: string;
  QTY: Qty;
  SIZE_ND: string;
  DESCRIPTION: string;
  Page: number;
  BBox: [number, number, number, number];
  Confidence: number;
  needs_review: boolean;
}

export interface BOMRecord {
  SourceFile: string;
  Supplier: "KENT" | "TENG" | "TECSAR" | "WORLEY" | "Unknown";
  DrawingNo: string;
  IssuedApprovedDate?: string;
  BOM: BOMItem[];
}

export enum ExtractionStatus {
  Idle = 'idle',
  Extracting = 'extracting',
  Review = 'review',
  Completed = 'completed',
  Error = 'error',
}

export enum AppView {
  Extractor = 'extractor',
  Dashboard = 'dashboard',
}

export interface LogEntry {
  timestamp: string;
  message: string;
  status: 'info' | 'processing' | 'success' | 'error';
}

export interface ExtractionSummary {
    filesProcessed: number;
    successCount: number;
    errorCount: number;
    totalItems: number;
    totalTime: number; // in seconds
    completionReason: 'finished' | 'stopped';
}
