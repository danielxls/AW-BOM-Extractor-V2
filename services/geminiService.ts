import { GoogleGenAI, Type } from "@google/genai";
import { BOMRecord, BOMItem, Qty } from '../types';

// The 'xlsx' library is loaded via a <script> tag in index.html, making it globally available.
// We declare it here to inform TypeScript of its existence on the `window` object.
declare var XLSX: any;

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
    } catch(e) {
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


export const extractBOM = async (files: File[]): Promise<BOMRecord[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const processFile = async (file: File): Promise<BOMRecord[]> => {
    const pdfPart = await fileToGenerativePart(file);
    
    const prompt = `
      You are an advanced document processing pipeline. Your task is to extract Bill of Materials (BOM) data from a multi-page engineering PDF.
      A single PDF file can contain multiple distinct drawings, often one per page.

      **Your process must be:**
      1.  Iterate through each page of the PDF.
      2.  For each page, identify if it contains a distinct engineering drawing with its own title block and a "BILL OF MATERIALS" table.
      3.  For each distinct drawing you find, perform the following two-stage extraction:

      **Stage 1: Structural Analysis (Simulating Document AI)**
      - Perform high-fidelity OCR on the drawing's page.
      - From the title block, extract the specific 'DrawingNo' and 'Supplier' for THIS drawing.
      - Locate the "BILL OF MATERIALS" table associated with THIS drawing.
      - For each row in the table, extract the raw text and estimate an OCR confidence score (0.0 to 1.0).

      **Stage 2: Semantic Interpretation & Cleaning (Gemini Reasoning)**
      - Clean up OCR errors from the extracted raw text.
      - For each item, record the page number it was found on.

      **Final Output:**
      Group the results by the distinct drawings you found. The final output must be a JSON object containing a 'drawings' array. Each object in the array represents a single drawing found in the PDF and must contain its specific Supplier, DrawingNo, and its complete list of BOM items, strictly adhering to the provided JSON schema.
    `;

    const bomItemSchema = {
        type: Type.OBJECT,
        properties: {
          ITEM: { type: Type.STRING, description: "The final, clean item number." },
          QTY: { type: Type.STRING, description: "The raw quantity value from the table, e.g., '43'-4\"'." },
          SIZE_ND: { type: Type.STRING, description: "The final, clean size or nominal diameter value." },
          DESCRIPTION: { type: Type.STRING, description: "The final, clean, full item description." },
          Page: { type: Type.INTEGER, description: "The page number where this item was found." },
          ocrConfidence: { type: Type.NUMBER, description: "Your estimated confidence (0.0 to 1.0) in the quality of the OCR for this specific row's data."}
        },
        required: ["ITEM", "QTY", "SIZE_ND", "DESCRIPTION", "Page", "ocrConfidence"],
    };
    
    const drawingSchema = {
        type: Type.OBJECT,
        properties: {
            Supplier: { type: Type.STRING, description: 'The supplier name for this drawing (KENT, TENG, TECSAR, WORLEY, or Unknown).' },
            DrawingNo: { type: Type.STRING, description: 'The specific drawing number for this drawing.' },
            BOM: {
                type: Type.ARRAY,
                items: bomItemSchema,
                description: "An array of all processed items from the Bill of Materials table for this drawing."
            }
        },
        required: ["Supplier", "DrawingNo", "BOM"],
    };
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            drawings: {
                type: Type.ARRAY,
                items: drawingSchema,
                description: "An array of all distinct drawings found in the document."
            }
        },
        required: ["drawings"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, pdfPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    });
    
    const jsonText = response.text.trim();
    const jsonResponse = JSON.parse(jsonText);

    if (!jsonResponse.drawings || !Array.isArray(jsonResponse.drawings)) {
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
  };

  try {
    const resultsPerFile = await Promise.all(files.map(file => processFile(file)));
    // Flatten the array of arrays into a single array of BOMRecords
    return resultsPerFile.flat();
  } catch(e) {
    console.error("Error during BOM Extraction:", e);
    throw new Error("Failed to extract data from one or more documents. The model may have had trouble parsing the file.");
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