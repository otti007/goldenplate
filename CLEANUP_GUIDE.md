# Golden Plate App Cleanup Guide

This guide explains which files are essential for the core functionality of the Golden Plate app and which files can be safely removed.

## Essential Files to Keep

These files are necessary for the basic functionality of the app:

1. **`simple_name_plates.html`** - The primary tracker application with a clean interface and name input popup
2. **`index.html`** - The main entry point for the application
3. **`app.js`** - Core JavaScript functionality for the main application
4. **`styles.css`** - Essential styling for the main application
5. **`fix_relationship.sql`** - Required SQL script to fix database relationships and add the name column

## Files That Can Be Safely Removed

The following files are redundant or no longer needed since we implemented the solution with the simplified tracker:

1. `simplified_tracker.html` - Redundant (simplified_tracker's functionality is now in simple_name_plates.html)
2. `plate_tracker.html` - Old version with visibility issues
3. `NAME_TRACKING_GUIDE.md` - Replaced by simplified instruction
4. `HOW_TO_USE_NAME_TRACKER.md` - Redundant documentation
5. `NAME_INPUT_VISIBILITY_FIX.md` - No longer needed
6. `NAME_TRACKING_FIX.md` - No longer needed
7. `NAME_TRACKING_TROUBLESHOOTING.md` - No longer needed
8. `NAME_TRACKING_README.md` - No longer needed 
9. `simple_name_tracker.html` - Older version, replaced by simple_name_plates.html
10. `fix_database.html` - No longer needed with the SQL script approach
11. `fix_schema.html` - No longer needed with the SQL script approach
12. `add_name_column.sql` - Functionality included in fix_relationship.sql
13. `create_exec_sql_function.sql` - Only needed if using RPC approach
14. `create_schools_table_simple.html` - One-time setup tool
15. `create_schools_table.html` - One-time setup tool
16. `FIX_RELATIONSHIP.md` - Documentation replaced by simpler instructions
17. `CHANGELOG.md` - Not essential for functionality
18. `setup.html` - One-time setup already completed
19. `migration.sql` - One-time migration already completed
20. `MIGRATION.md` - Documentation for completed migration
21. `setup_database.sql` - Initial setup already completed
22. `firebase-module-test.html` - Testing file

## Recommended Approach

1. **Keep only the essential files** listed in the first section
2. **Create a simplified README.md** with basic instructions for using the app
3. **Backup all files** before deletion, in case you need to reference them later

The `simple_name_plates.html` file now contains all the necessary functionality for tracking student names with plates in a clean, gold-themed interface. It works standalone and doesn't require the other tracker files.

## Quick Start

After cleanup, you can use the app by:

1. Opening `index.html` for the main application
2. Opening `simple_name_plates.html` directly for the plate tracker with name input
3. Running `fix_relationship.sql` in Supabase SQL Editor if you haven't already 