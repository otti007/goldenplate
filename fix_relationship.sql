-- Fix relationship between sessions and schools tables

-- Step 1: Make sure the schools table exists
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Step 2: Check if sessions table has school_id column
DO $$
BEGIN
    -- If sessions table exists but doesn't have school_id
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'school_id'
    ) THEN
        -- If school_name column exists, migrate data
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'sessions' AND column_name = 'school_name'
        ) THEN
            -- Create schools from session school_names
            INSERT INTO schools (name, created_at)
            SELECT DISTINCT school_name, MIN(created_at) 
            FROM sessions 
            GROUP BY school_name
            ON CONFLICT (name) DO NOTHING;
            
            -- Create temporary sessions table with new structure
            CREATE TABLE sessions_temp (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
                clean_plates INTEGER NOT NULL DEFAULT 0,
                dirty_plates INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
            );
            
            -- Copy data to new table
            INSERT INTO sessions_temp (id, school_id, clean_plates, dirty_plates, created_at)
            SELECT s.id, 
                   (SELECT id FROM schools WHERE name = s.school_name), 
                   s.clean_plates, 
                   s.dirty_plates, 
                   s.created_at
            FROM sessions s;
            
            -- Rename tables
            ALTER TABLE sessions RENAME TO sessions_old;
            ALTER TABLE sessions_temp RENAME TO sessions;
            
            -- Create index
            CREATE INDEX IF NOT EXISTS idx_sessions_school_id ON sessions(school_id);
            
            RAISE NOTICE 'Sessions table migrated to use school_id instead of school_name';
        ELSE
            RAISE NOTICE 'Sessions table exists but has no school_name column. Manual intervention required.';
        END IF;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'sessions'
    ) THEN
        -- Create sessions table if it doesn't exist
        CREATE TABLE sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
            clean_plates INTEGER NOT NULL DEFAULT 0,
            dirty_plates INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_sessions_school_id ON sessions(school_id);
        
        RAISE NOTICE 'Sessions table created with school_id column';
    ELSE
        RAISE NOTICE 'Sessions table already has school_id column';
    END IF;
END $$;

-- Step 3: Make sure plates table exists and references sessions
CREATE TABLE IF NOT EXISTS plates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    is_clean BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_plates_session_id ON plates(session_id);

-- Step 4: Set up Row Level Security (RLS)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
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

-- Step 6: Create trigger function for updating session counts
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

-- Create trigger
DROP TRIGGER IF EXISTS update_session_counts_trigger ON plates;
CREATE TRIGGER update_session_counts_trigger
AFTER INSERT ON plates
FOR EACH ROW
EXECUTE FUNCTION update_session_counts();

-- Step 7: Verify the relationship
SELECT 
    'Relationship verification' AS check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'sessions' 
            AND ccu.table_name = 'schools'
        ) THEN 'OK: Foreign key from sessions to schools exists'
        ELSE 'ERROR: No foreign key from sessions to schools'
    END AS status;

-- Fix Foreign Key Constraint Issue for Golden Plate
-- This script resolves the "insert or update on table "plates" violates foreign key constraint "plates_session_id_fkey"" error
-- Run this in the Supabase SQL Editor (https://app.supabase.com/project/ufuwsxtyvaeupqkzuuhb/sql)

-- 1. Create a backup of existing data (just in case)
CREATE TABLE IF NOT EXISTS sessions_backup AS SELECT * FROM sessions;
CREATE TABLE IF NOT EXISTS plates_backup AS SELECT * FROM plates;

-- 2. First, let's make sure the schools table exists and has data
DO $$
BEGIN
    -- Create schools table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schools') THEN
        CREATE TABLE schools (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
        
        -- Add a default school
        INSERT INTO schools (name) VALUES ('Default School');
    END IF;
END $$;

-- 3. Fix the sessions table structure
DO $$
BEGIN
    -- Make sure sessions table has school_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' AND column_name = 'school_id'
    ) THEN
        -- Add school_id column
        ALTER TABLE sessions ADD COLUMN school_id UUID;
        
        -- Link to default school if exists
        UPDATE sessions s
        SET school_id = (SELECT id FROM schools ORDER BY created_at LIMIT 1)
        WHERE s.school_id IS NULL;
        
        -- Make it not null
        ALTER TABLE sessions ALTER COLUMN school_id SET NOT NULL;
        
        -- Add foreign key constraint
        ALTER TABLE sessions ADD CONSTRAINT sessions_school_id_fkey 
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Drop and recreate plates foreign key constraint
DO $$
BEGIN
    -- Drop the constraint if it exists
    BEGIN
        ALTER TABLE plates DROP CONSTRAINT IF EXISTS plates_session_id_fkey;
    EXCEPTION WHEN OTHERS THEN
        -- Constraint might not exist, continue
    END;
    
    -- Recreate the constraint
    BEGIN
        ALTER TABLE plates ADD CONSTRAINT plates_session_id_fkey 
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add constraint, checking for orphaned records...';
    END;
END $$;

-- 5. Clean up orphaned plates records that don't link to valid sessions
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned records
    SELECT COUNT(*) INTO orphaned_count
    FROM plates p
    WHERE NOT EXISTS (
        SELECT 1 FROM sessions s WHERE s.id = p.session_id
    );
    
    -- Delete orphaned records if they exist
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned plate records. Deleting them...', orphaned_count;
        
        DELETE FROM plates
        WHERE NOT EXISTS (
            SELECT 1 FROM sessions s WHERE s.id = session_id
        );
        
        RAISE NOTICE 'Deleted % orphaned plate records', orphaned_count;
    ELSE
        RAISE NOTICE 'No orphaned plate records found';
    END IF;
END $$;

-- 6. Add name column to plates table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'plates' AND column_name = 'name'
    ) THEN
        ALTER TABLE plates ADD COLUMN name TEXT;
        RAISE NOTICE 'Added name column to plates table';
    ELSE
        RAISE NOTICE 'Name column already exists in plates table';
    END IF;
END $$;

-- 7. Recreate the constraint after cleanup
ALTER TABLE plates DROP CONSTRAINT IF EXISTS plates_session_id_fkey;
ALTER TABLE plates ADD CONSTRAINT plates_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;

-- 8. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_plates_session_id ON plates(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_school_id ON sessions(school_id);

-- 9. Set up RLS policies (if they don't exist)
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
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

-- 10. Ensure trigger function exists
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

-- 11. Recreate trigger
DROP TRIGGER IF EXISTS update_session_counts_trigger ON plates;
CREATE TRIGGER update_session_counts_trigger
AFTER INSERT ON plates
FOR EACH ROW
EXECUTE FUNCTION update_session_counts();

-- 12. Refresh Postgres schema cache
SELECT pg_notify('reload_schemas', '');

-- 13. Verify results
SELECT 'Fix completed successfully. The relationship between plates and sessions should now be working properly.' AS result;

-- Show table counts for verification
SELECT 'schools' as table_name, COUNT(*) as record_count FROM schools
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as record_count FROM sessions
UNION ALL
SELECT 'plates' as table_name, COUNT(*) as record_count FROM plates; 