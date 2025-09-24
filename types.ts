
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
  Done = 'done',
  Error = 'error',
}

export enum AppView {
  Extractor = 'extractor',
  Dashboard = 'dashboard',
}
