-- Migration 00013: Add views_count field to projects table
-- This migration adds a views_count field to track how many times a project has been viewed

-- Add the views_count column to the projects table with default value 0
ALTER TABLE projects 
ADD COLUMN views_count INTEGER NOT NULL DEFAULT 0;

-- Add comment to the column
COMMENT ON COLUMN projects.views_count IS 'Number of times this project has been viewed';

-- Update RLS policies to include the new column
DO $$
BEGIN
  -- Check if the policy exists and update it
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_select_policy'
  ) THEN
    DROP POLICY IF EXISTS projects_select_policy ON projects;
    
    CREATE POLICY projects_select_policy ON projects
      FOR SELECT USING (
        auth.uid() = user_id
      );
  END IF;
  
  -- Update insert policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_insert_policy'
  ) THEN
    DROP POLICY IF EXISTS projects_insert_policy ON projects;
    
    CREATE POLICY projects_insert_policy ON projects
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
      );
  END IF;
  
  -- Update update policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_update_policy'
  ) THEN
    DROP POLICY IF EXISTS projects_update_policy ON projects;
    
    CREATE POLICY projects_update_policy ON projects
      FOR UPDATE USING (
        auth.uid() = user_id
      );
  END IF;
  
  -- Update delete policy
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'projects' AND policyname = 'projects_delete_policy'
  ) THEN
    DROP POLICY IF EXISTS projects_delete_policy ON projects;
    
    CREATE POLICY projects_delete_policy ON projects
      FOR DELETE USING (
        auth.uid() = user_id
      );
  END IF;
END $$;