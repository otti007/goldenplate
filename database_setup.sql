-- Golden Plate Database Setup
-- Run this script in the Supabase SQL Editor to set up the database tables

-- Create Schools Table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    clean_plates INTEGER NOT NULL DEFAULT 0,
    dirty_plates INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create Plates Table
CREATE TABLE IF NOT EXISTS plates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    is_clean BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_plates_session_id ON plates(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_school_id ON sessions(school_id);

-- Set up Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
-- Note: In a production environment, you would want to restrict access based on user authentication

-- Schools policies
DROP POLICY IF EXISTS "Allow public read access to schools" ON schools;
CREATE POLICY "Allow public read access to schools" ON schools
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to schools" ON schools;
CREATE POLICY "Allow public insert access to schools" ON schools
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to schools" ON schools;
CREATE POLICY "Allow public update access to schools" ON schools
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to schools" ON schools;
CREATE POLICY "Allow public delete access to schools" ON schools
    FOR DELETE USING (true);

-- Sessions policies
DROP POLICY IF EXISTS "Allow public read access to sessions" ON sessions;
CREATE POLICY "Allow public read access to sessions" ON sessions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to sessions" ON sessions;
CREATE POLICY "Allow public insert access to sessions" ON sessions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access to sessions" ON sessions;
CREATE POLICY "Allow public update access to sessions" ON sessions
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete access to sessions" ON sessions;
CREATE POLICY "Allow public delete access to sessions" ON sessions
    FOR DELETE USING (true);

-- Plates policies
DROP POLICY IF EXISTS "Allow public read access to plates" ON plates;
CREATE POLICY "Allow public read access to plates" ON plates
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert access to plates" ON plates;
CREATE POLICY "Allow public insert access to plates" ON plates
    FOR INSERT WITH CHECK (true);

-- Optional: Create a function to update session counts when plates are added
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_clean THEN
        UPDATE sessions 
        SET clean_plates = clean_plates + 1
        WHERE id = NEW.session_id;
    ELSE
        UPDATE sessions 
        SET dirty_plates = dirty_plates + 1
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update session counts
DROP TRIGGER IF EXISTS update_session_counts_trigger ON plates;
CREATE TRIGGER update_session_counts_trigger
AFTER INSERT ON plates
FOR EACH ROW
EXECUTE FUNCTION update_session_counts(); 