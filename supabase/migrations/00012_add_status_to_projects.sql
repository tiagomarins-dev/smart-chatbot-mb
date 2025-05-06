-- Migration 00012: Add status field to projects table
-- This migration adds a status field to the projects table to track project phases

-- First, create an enum type for project status
CREATE TYPE project_status AS ENUM (
  'em_planejamento', 
  'em_andamento', 
  'pausado', 
  'concluido', 
  'cancelado'
);

-- Then, add the status column to the projects table with default value
ALTER TABLE projects 
ADD COLUMN status project_status NOT NULL DEFAULT 'em_planejamento';

-- Add comment to the column
COMMENT ON COLUMN projects.status IS 'Current status/phase of the project';

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