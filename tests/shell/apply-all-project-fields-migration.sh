#!/bin/bash

# Script to ensure all project fields exist in the database

# Navigate to the supabase directory
cd "$(dirname "$0")/supabase"

# Check if we are in the supabase directory
if [ ! -f "run-migrations.sh" ]; then
  echo "Error: Could not find run-migrations.sh in the current directory."
  exit 1
fi

# Run all project-related migrations in sequence
echo "Running migrations to ensure all project fields exist..."

echo "Step 1: Adding status field..."
./run-migrations.sh 00012_add_status_to_projects.sql

echo "Step 2: Adding views_count field..."
./run-migrations.sh 00013_add_views_count_to_projects.sql

echo "Step 3: Ensuring all other project fields exist..."
./run-migrations.sh 00014_ensure_all_project_fields.sql

echo "Step 4: Adding campaign date fields..."
./run-migrations.sh 00015_add_campaign_dates.sql

# Check the result
if [ $? -eq 0 ]; then
  echo "All migrations completed successfully!"
  echo "The projects table now has all the required fields:"
  echo "- status (project phase tracking)"
  echo "- views_count (view tracking)"
  echo "- start_date and end_date (legacy fields)"
  echo "- campaign_start_date and campaign_end_date (current date fields)"
else
  echo "Migration process encountered errors. Please check the messages above."
  exit 1
fi

echo "Your projects table is now fully compatible with the frontend interface."