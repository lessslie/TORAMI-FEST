-- Convert CosplayGuest.messages from jsonb to jsonb[]
-- First, update any existing data to be wrapped in an array
UPDATE "CosplayGuest"
SET "messages" = ARRAY["messages"]::jsonb[]
WHERE "messages" IS NOT NULL;

-- Now alter the column type
ALTER TABLE "CosplayGuest"
ALTER COLUMN "messages" TYPE jsonb[] USING ARRAY["messages"]::jsonb[];

-- Set the default for new records
ALTER TABLE "CosplayGuest"
ALTER COLUMN "messages" SET DEFAULT ARRAY[]::jsonb[];
