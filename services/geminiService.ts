import { supabase } from './supabase';
import { BOMRecord, BOMItem, Qty } from '../types';

import * as XLSX from 'xlsx';

// Utility to convert a File object to a GoogleGenAI.Part object
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

// Normalizes the raw QTY string into a structured object
const normalizeQty = (raw: string): Qty => {
  if (!raw) return { raw: '', unit: 'unknown', value: null };

  let unit: Qty['unit'] = 'unknown';
  let value: Qty['value'] = null;

  try {
    const feetInchesMatch = raw.match(/(\d+)'?-?(\d*\.?\d*)"?/);
    if (feetInchesMatch && (feetInchesMatch[1] || feetInchesMatch[2])) {
      const feet = parseFloat(feetInchesMatch[1] || '0');
      const inches = parseFloat(feetInchesMatch[2] || '0');
      value = feet + inches / 12;
      unit = 'ft';
    } else if (raw.includes("'")) {
      value = parseFloat(raw.replace("'", ""));
      unit = 'ft';
    } else if (raw.includes('"')) {
      value = parseFloat(raw.replace('"', ""));
      unit = 'in';
    } else if (raw.toLowerCase().includes("m")) {
      value = parseFloat(raw);
      unit = 'm';
    } else if (!isNaN(parseFloat(raw))) {
      value = parseFloat(raw);
    }
  } catch (e) {
    console.error("Could not parse QTY:", raw, e);
  }

  return { raw, unit, value: (value !== null && !isNaN(value)) ? value : null };
};

/**
 * Adjusts a base confidence score based on logical business rules.
 * This simulates a secondary validation layer after an initial OCR confidence score is obtained.
 */
const applyBusinessLogicConfidence = (baseConfidence: number, item: { ITEM: string; QTY: Qty; DESCRIPTION: string; SIZE_ND: string; }): number => {
  let score = baseConfidence;
  if (!item.ITEM || isNaN(parseInt(item.ITEM, 10))) score -= 0.2;
  if (item.QTY.value === null) score -= 0.2;
  if (!item.DESCRIPTION || item.DESCRIPTION.length < 3) score -= 0.1;
  if (!item.SIZE_ND) score -= 0.05;
  return Math.max(0.1, score); // Ensure a minimum confidence floor
};


export const extractBOM = async (file: File, onProgress: (message: string) => void): Promise<BOMRecord[]> => {
  try {
    const pdfPart = await fileToGenerativePart(file);

    onProgress("Sending document to secure backend for analysis...");

    const { data: jsonResponse, error } = await supabase.functions.invoke('process-document', {
      body: {
        fileData: pdfPart.inlineData.data,
        mimeType: pdfPart.inlineData.mimeType,
      },
    });

    if (error) {
      console.error("Supabase Function Error:", error);
      throw new Error(`Backend communication failed: ${error.message}`);
    }

    if (jsonResponse && jsonResponse.isError) {
      console.error("Backend Logic Error:", jsonResponse);
      throw new Error(`Backend Processing Error: ${jsonResponse.error} (${jsonResponse.details})`);
    }

    if (!jsonResponse || !jsonResponse.drawings || !Array.isArray(jsonResponse.drawings)) {
      console.warn("Model response did not contain a 'drawings' array.", jsonResponse);
      return [];
    }

    const records: BOMRecord[] = jsonResponse.drawings.map((drawing: any, drawingIndex: number) => {
      const bomItems: BOMItem[] = (drawing.BOM || []).map((item: any, itemIndex: number) => {
        const normalizedQty = normalizeQty(item.QTY || '');
        const baseConfidence = typeof item.ocrConfidence === 'number' ? item.ocrConfidence : 0.85;
        const finalConfidence = applyBusinessLogicConfidence(baseConfidence, {
          ITEM: item.ITEM || '',
          QTY: normalizedQty,
          SIZE_ND: item.SIZE_ND || '',
          DESCRIPTION: item.DESCRIPTION || '',
        });

        return {
          id: `${file.name}-drawing-${drawingIndex}-item-${itemIndex}`,
          ITEM: item.ITEM || '',
          QTY: normalizedQty,
          SIZE_ND: item.SIZE_ND || '',
          DESCRIPTION: item.DESCRIPTION || '',
          Page: item.Page || 0,
          BBox: [0, 0, 0, 0],
          Confidence: finalConfidence,
          needs_review: finalConfidence < 0.90,
        };
      });

      return {
        SourceFile: file.name,
        Supplier: drawing.Supplier || 'Unknown',
        DrawingNo: drawing.DrawingNo || `N/A (Drawing ${drawingIndex + 1})`,
        IssuedApprovedDate: drawing.IssuedApprovedDate,
        BOM: bomItems
      };
    });

    return records;
  } catch (e) {
    console.error(`Error during BOM Extraction for ${file.name}:`, e);
    throw new Error(`Failed to extract data from ${file.name}. The backend service encountered an error.`);
  }
};


// Generates and downloads an Excel file from the BOM data.
export const exportToExcel = (data: BOMRecord[]) => {
  if (data.length === 0) {
    alert("No data to export.");
    return;
  }

  const flattenedData = data.flatMap(record =>
    record.BOM.map(item => ({
      'Source File': record.SourceFile,
      'Supplier': record.Supplier,
      'Drawing No': record.DrawingNo,
      'Item': item.ITEM,
      'Qty (Raw)': item.QTY.raw,
      'Qty (Unit)': item.QTY.unit,
      'Qty (Value)': item.QTY.value,
      'Size/ND': item.SIZE_ND,
      'Description': item.DESCRIPTION,
      'Page': item.Page,
      'Needs Review': item.needs_review ? 'Yes' : 'No',
      'Confidence': (item.Confidence * 100).toFixed(1) + '%'
    }))
  );

  const ws = XLSX.utils.json_to_sheet(flattenedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOM Data');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  XLSX.writeFile(wb, `BOM_Export_${timestamp}.xlsx`);
};
