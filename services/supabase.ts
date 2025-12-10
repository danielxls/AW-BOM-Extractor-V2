import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ExtractionLogDB {
    id?: string;
    created_at?: string;
    user_email: string;
    file_name: string;
    supplier: string;
    item_count: number;
    processing_time: number;
    average_confidence: number;
}

export const saveExtractionLog = async (log: ExtractionLogDB) => {
    const { data, error } = await supabase
        .from('extraction_logs')
        .insert([log])
        .select();

    if (error) {
        console.error('Error saving extraction log:', error);
        return null;
    }
    return data;
};

export const getExtractionLogs = async () => {
    const { data, error } = await supabase
        .from('extraction_logs')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching logs:', error);
        return [];
    }
    return data as ExtractionLogDB[];
};

