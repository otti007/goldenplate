# Golden Plate App

A simple application for tracking clean and dirty plates with student names.

## Core Features

- Record clean and dirty plates
- Add student names to plate records
- Track counts of clean vs. dirty plates
- Beautiful gold-themed interface
- Name input popup for both main app and standalone tracker

## Files in this Project

- **simple_name_plates.html** - Standalone tracker for recording plates with names
- **index.html** - Main application entry point with integrated name tracking
- **app.js** - Core application logic including name input functionality
- **styles.css** - Application styling including modal styles
- **fix_relationship.sql** - Database setup script

## Setup Instructions

1. Ensure the database is properly set up:
   - Run `fix_relationship.sql` in the Supabase SQL Editor

2. Access the application:
   - Open `index.html` for the main application interface with name tracking
   - Or open `simple_name_plates.html` directly for the standalone name tracker

## Using the Name Tracker

Both the main application and the standalone tracker now include name input:

### In the Main Application (index.html)
1. Open `index.html` and navigate to a school and session
2. Click either "Clean Plate" or "Dirty Plate"
3. In the popup, enter the student's name (or leave blank)
4. Click "Submit"
5. The counter will update showing clean and dirty plate counts

### In the Standalone Tracker (simple_name_plates.html)
1. Open `simple_name_plates.html` in your browser
2. Click either "Clean Plate" or "Dirty Plate"
3. In the popup, enter the student's name (or leave blank)
4. Click "Submit"
5. The counter will update showing clean and dirty plate counts

## Database Structure

The app uses three main tables:
- **schools** - Contains school information
- **sessions** - Tracking sessions linked to schools
- **plates** - Individual plate records with name and clean/dirty status

## Troubleshooting

- **Name column missing error**: Run `fix_relationship.sql` script
- **Popup not appearing**: Try a different browser (Chrome or Firefox)
- **Database errors**: Check your Supabase connection settings
- **Unable to record plates**: Check your browser console for error messages

## Development Notes

- For testing, the tracker uses a default session ID of '1'
- To use with a specific session, add `?session_id=X` to the URL for the standalone tracker
- The app automatically attempts to add the name column if missing
- The name field is optional - plates can be recorded without a name if desired 