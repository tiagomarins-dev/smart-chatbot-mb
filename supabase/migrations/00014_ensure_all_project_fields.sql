-- Migration 00014: Ensure all project fields exist
-- This migration ensures all fields referenced in the frontend interface exist in the database

-- Check if start_date column exists and add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN start_date DATE;
    COMMENT ON COLUMN projects.start_date IS 'Legacy field for project start date';
  END IF;
END $$;

-- Check if end_date column exists and add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN end_date DATE;
    COMMENT ON COLUMN projects.end_date IS 'Legacy field for project end date';
  END IF;
END $$;

-- Add any missing RLS policies
DO $$
BEGIN
  -- Ensure table has RLS enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'projects' AND rowsecurity = true
  ) THEN
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Check if the select policy exists and create if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_select_policy'
  ) THEN
    CREATE POLICY projects_select_policy ON projects
      FOR SELECT USING (
        auth.uid() = user_id
      );
  END IF;
  
  -- Check if the insert policy exists and create if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_insert_policy'
  ) THEN
    CREATE POLICY projects_insert_policy ON projects
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
      );
  END IF;
  
  -- Check if the update policy exists and create if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_update_policy'
  ) THEN
    CREATE POLICY projects_update_policy ON projects
      FOR UPDATE USING (
        auth.uid() = user_id
      );
  END IF;
  
  -- Check if the delete policy exists and create if missing
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_delete_policy'
  ) THEN
    CREATE POLICY projects_delete_policy ON projects
      FOR DELETE USING (
        auth.uid() = user_id
      );
  END IF;
END $$;