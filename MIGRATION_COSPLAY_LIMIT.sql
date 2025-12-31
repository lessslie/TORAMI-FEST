-- Migration: Add Cosplay Limit System
-- Run this SQL in your Supabase SQL Editor
-- Date: 2025-12-31

-- 1. Add cosplayLimit field to AppConfig table
ALTER TABLE "AppConfig"
ADD COLUMN "cosplayLimit" INTEGER NOT NULL DEFAULT 20;

-- 2. Update CosplayStatus enum to include WAITING_LIST
-- First, check current enum values
DO $$
BEGIN
    -- Add new WAITING_LIST value to the enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'WAITING_LIST'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CosplayStatus')
    ) THEN
        ALTER TYPE "CosplayStatus" ADD VALUE 'WAITING_LIST';
    END IF;
END$$;

-- 3. Add notifyEmail field to CosplayRegistration (optional, for waiting list notifications)
ALTER TABLE "CosplayRegistration"
ADD COLUMN "notifyEmail" TEXT;

-- 4. Create index for better performance when counting slots
CREATE INDEX IF NOT EXISTS "CosplayRegistration_status_idx" ON "CosplayRegistration"("status");

-- 5. Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'AppConfig' AND column_name = 'cosplayLimit';

SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'CosplayRegistration' AND column_name = 'notifyEmail';

-- 6. Show all CosplayStatus enum values to confirm WAITING_LIST was added
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CosplayStatus')
ORDER BY enumsortorder;
