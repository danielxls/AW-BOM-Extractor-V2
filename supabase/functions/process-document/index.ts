import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');

    try {
        const { fileData, mimeType } = await req.json();

        if (!fileData || !mimeType) {
            throw new Error("Missing fileData or mimeType in request body.");
        }

        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY environment variable.");
            throw new Error("Missing GEMINI_API_KEY environment variable. Make sure to set it via 'supabase secrets set'.");
        }

        console.log("Initializing Gemini Client with API Key length:", apiKey.length);

        // Initialize the Stable SDK
        const genAI = new GoogleGenerativeAI(apiKey);

        // User research indicates "gemini-2.5-flash" exists. Testing availability.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const prompt = `
      You are an expert Engineering Document Parsing AI. Your goal is to extract the Bill of Materials (BOM) from the provided engineering drawing PDF with 100% accuracy.

      **INSTRUCTIONS - THINK STEP-BY-STEP:**
      1. **Analyze**: Scan the document for the "BILL OF MATERIALS" (or "B.O.M") table.
      2. **Identify Headers**: Locate the specific columns for ITEM, QTY, DESCRIPTION, SIZE, etc.
      3. **Detect Anomalies**: Look for multi-line descriptions or merged cells.
      4. **Extract**: Convert the table data into the structured JSON below.
      5. **Refine**: Review your extracted rows. If a Description is "PIPE, SEAMLESS...", ensure the Size "4"" is NOT left inside the description.

      **FEW-SHOT EXAMPLES (LEARN FROM THESE):**
      - **Input Row**: "1  4  PIPE, SA-106 GR.B, SMLS  2" SCH 40"
      - **Output Object**: { "ITEM": "1", "QTY": "4", "DESCRIPTION": "PIPE, SA-106 GR.B, SMLS", "SIZE_ND": "2\"", "ocrConfidence": 0.98 }
      
      - **Input Row** (Merged Text): "2  10  ELBOW 90deg LR  6" 150#"
      - **Output Object**: { "ITEM": "2", "QTY": "10", "DESCRIPTION": "ELBOW 90deg LR", "SIZE_ND": "6\" 150#", "ocrConfidence": 0.95 }

      **STRICT OUTPUT SCHEMA:**
      You must return a SINGLE JSON Object with TWO top-level properties:
      1. "_reasoning" (string): A short explanation of what you found (e.g., "Found a 12-row BOM table on Page 1. Columns detected: Item, Qty, Desc...").
      2. "drawings" (array): An array of objects containing the extracted data.

      Each object in the "drawings" array must have:
      - "Supplier" (string): The supplier name.
      - "DrawingNo" (string): The drawing number.
      - "BOM" (array): An array of objects representing the BOM rows.

      Each object in the "BOM" array MUST have the following keys (matches the frontend expectation exactly):
      - "ITEM" (string): The item number.
      - "QTY" (string): The quantity (keep raw text if unit is present).
      - "DESCRIPTION" (string): Full description text (combine multi-line rows).
      - "SIZE_ND" (string): Size and/or Rating information combined.
      - "ocrConfidence" (number): A decimal 0.0-1.0 confidence score (be conservative).

      **EXTRACTION RULES:**
      1. **Keys**: You must use the EXACT keys listed above (UPPERCASE for BOM items).
      2. **Nulls**: Use null or empty string if a value is not found. Do not omit keys.
      3. **Accuracy**: If a cell is blurry, use context from descriptions to infer.

      Return ONLY the valid JSON.
    `;

        // Construct parts array for the prompt
        const imagePart = {
            inlineData: {
                data: fileData,
                mimeType: mimeType
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const generatedText = response.text();

        return new Response(generatedText, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error processing document:", error);

        let availableModels = "Could not fetch models";
        // Attempt to list models if we hit a 404 to help debug
        if (error.message && error.message.includes('404') && apiKey) {
            try {
                // Manual fetch to list models since SDK might fail
                const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
                const listData = await listResp.json();
                if (listData.models) {
                    availableModels = listData.models.map((m: any) => m.name).join(', ');
                }
            } catch (listErr) {
                availableModels = `Failed to list: ${listErr.message}`;
            }
        }

        // Debug mode: Return 200 so the client can read the body
        return new Response(JSON.stringify({
            error: error.message || "Unknown error occurred",
            details: error.toString(),
            availableModels: availableModels,
            isError: true
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }
});
