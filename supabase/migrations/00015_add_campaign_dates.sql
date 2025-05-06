-- Migration 00015: Add campaign_start_date and campaign_end_date columns
-- This migration ensures campaign date fields exist in the database

-- Check if campaign_start_date column exists and add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'campaign_start_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN campaign_start_date DATE;
    COMMENT ON COLUMN projects.campaign_start_date IS 'Start date of the project campaign';
  END IF;
END $$;

-- Check if campaign_end_date column exists and add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'campaign_end_date'
  ) THEN
    ALTER TABLE projects ADD COLUMN campaign_end_date DATE;
    COMMENT ON COLUMN projects.campaign_end_date IS 'End date of the project campaign';
  END IF;
END $$;