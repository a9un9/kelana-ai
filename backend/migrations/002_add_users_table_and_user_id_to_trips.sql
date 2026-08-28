CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255)
);

-- Insert a default user to assign existing trips to (if it doesn't exist)
INSERT INTO users (name, email, password_hash)
VALUES ('System Default', 'default@example.com', 'hash')
ON CONFLICT (email) DO NOTHING;

-- Add user_id column
ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- Update existing trips
UPDATE trips 
SET user_id = (SELECT id FROM users WHERE email = 'default@example.com' LIMIT 1) 
WHERE user_id IS NULL;

-- Enforce NOT NULL
ALTER TABLE trips ALTER COLUMN user_id SET NOT NULL;

-- Add FOREIGN KEY constraint
-- We use DO block to add constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trips_users'
    ) THEN
        ALTER TABLE trips
        ADD CONSTRAINT fk_trips_users
        FOREIGN KEY (user_id) REFERENCES users(id);
    END IF;
END $$;
