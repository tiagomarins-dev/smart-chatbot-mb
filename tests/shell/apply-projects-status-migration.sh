#!/bin/bash

# Script to apply the status field migration to projects table

# Navigate to the supabase directory
cd "$(dirname "$0")/supabase"

# Check if we are in the supabase directory
if [ ! -f "run-migrations.sh" ]; then
  echo "Error: Could not find run-migrations.sh in the current directory."
  exit 1
fi

# Run the migration
echo "Running migration to add status field to projects table..."
./run-migrations.sh 00012_add_status_to_projects.sql

# Check the result
if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
  echo "The 'status' field has been added to the projects table."
  echo "You can now use this field to track the phase of each project."
else
  echo "Migration failed. Please check the error messages above."
  exit 1
fi

echo "Done!"