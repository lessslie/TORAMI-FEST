-- Migración Manual: Agregar campos de entrada paga/gratis a Event
-- Ejecutar esto en Supabase SQL Editor: https://supabase.com/dashboard/project/[tu-proyecto]/sql

-- Agregar columna isFree (entrada libre y gratuita)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN NOT NULL DEFAULT true;

-- Agregar columna ticketPrice (precio de la entrada)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "ticketPrice" DECIMAL(10,2);

-- Agregar columna ticketLink (link para comprar tickets)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "ticketLink" TEXT;

-- Verificar que las columnas se crearon correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Event'
AND column_name IN ('isFree', 'ticketPrice', 'ticketLink');
