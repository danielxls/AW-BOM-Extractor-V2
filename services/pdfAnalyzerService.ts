import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs';

// Set the worker source to a version matching the library
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';

interface PdfAnalysisResult {
  pageCount: number;
}

/**
 * Analyzes a PDF file to count total pages.
 * @param file The PDF file to analyze.
 * @returns A promise that resolves with the total page count.
 */
export const analyzePdf = async (file: File): Promise<PdfAnalysisResult> => {
  const arrayBuffer = await file.arrayBuffer();
  
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;

  return { pageCount };
};