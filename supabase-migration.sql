-- Database Migration for Multi-Assessment Support
-- Run this in your Supabase SQL Editor

-- Add assessment_id column to track which assessment each submission belongs to
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS assessment_id TEXT DEFAULT 'waveform-octaves';

-- Update existing submissions to have the correct assessment_id
UPDATE submissions
SET assessment_id = 'waveform-octaves'
WHERE assessment_id IS NULL;

-- Create an index for faster filtering by assessment
CREATE INDEX IF NOT EXISTS idx_submissions_assessment_id
ON submissions(assessment_id);

-- Create an index for faster filtering by student name
CREATE INDEX IF NOT EXISTS idx_submissions_student_name
ON submissions(student_name);

-- Optional: Create an assessments table if you want to manage assessments in the database
-- (Currently assessments are defined in code, but this allows future flexibility)

-- CREATE TABLE IF NOT EXISTS assessments (
--     id TEXT PRIMARY KEY,
--     title TEXT NOT NULL,
--     description TEXT,
--     type TEXT NOT NULL CHECK (type IN ('drawing', 'quiz', 'listening')),
--     topic TEXT,
--     is_active BOOLEAN DEFAULT true,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- INSERT INTO assessments (id, title, description, type, topic) VALUES
-- ('waveform-octaves', 'Octave Waveform Drawing', 'Draw waveforms showing octave transpositions', 'drawing', '2.5 Numeracy')
-- ON CONFLICT (id) DO NOTHING;
