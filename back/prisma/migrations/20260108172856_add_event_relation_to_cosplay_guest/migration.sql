-- Add foreign key constraint for event relation in CosplayGuest
-- This establishes the relationship between CosplayGuest.eventId and Event.id
-- No ALTER needed since eventId field already exists, we're just adding the FK constraint

ALTER TABLE "CosplayGuest" ADD CONSTRAINT "CosplayGuest_eventId_fkey"
FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
