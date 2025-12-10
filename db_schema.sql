-- Create a table to store extraction session logs
create table if not exists extraction_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_email text,
  file_name text not null,
  supplier text,
  item_count integer not null,
  processing_time numeric, -- in seconds
  average_confidence numeric -- percentage (0-100) or decimal (0-1)
);

-- Enable RLS
alter table extraction_logs enable row level security;

-- Policy to allow authenticated users to see/insert their own data (or all data for this demo)
-- For simplicity in this demo environment, we'll allow public access or authenticated access
create policy "Enable all access for authenticated users" 
on extraction_logs for all 
to authenticated 
using (true) 
with check (true);

-- If using anon key without auth enforcement for testing:
create policy "Enable insert for anon" 
on extraction_logs for insert 
to anon 
with check (true);

create policy "Enable select for anon" 
on extraction_logs for select 
to anon 
using (true);
