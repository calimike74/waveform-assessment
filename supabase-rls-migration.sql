-- Enable Row Level Security on submissions table
-- Run this in your Supabase SQL Editor
--
-- Access model:
--   Anon key (students): INSERT only — submit assessments
--   Service role key (API routes): bypasses RLS — teacher reads, AI marking updates
--   No code path deletes submissions

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Students can insert submissions (no auth required)
CREATE POLICY "Students can insert submissions"
ON submissions FOR INSERT
WITH CHECK (true);

-- Block all other operations via anon key
-- SELECT, UPDATE, DELETE are only accessible via service role key (API routes)
