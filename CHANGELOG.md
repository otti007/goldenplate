# Changelog

## Version 2.0.0 - Database Structure Update

### Added
- New `schools` table to store school information separately
- School management interface on the home page
- Migration script for existing users to upgrade their database
- Migration documentation in `MIGRATION.md`
- Database structure documentation in `README.md`

### Changed
- Modified `sessions` table to reference schools by `school_id` instead of `school_name`
- Updated database setup script to include the schools table
- Updated application code to work with the new database structure
- Improved user interface for managing schools and sessions
- Enhanced documentation with clearer instructions

### Fixed
- Improved data integrity with proper foreign key relationships
- Better organization of school data with a dedicated table

## Version 1.0.0 - Initial Release

### Features
- Track clean and dirty plates for school cafeterias
- Create sessions for different schools
- View statistics with pie charts
- Browse and view previous sessions
- Responsive design for desktop and mobile devices
- Data persistence with Supabase backend 