
-- Add 'complexa' to declaration_type enum
ALTER TYPE public.declaration_type ADD VALUE IF NOT EXISTS 'complexa';

-- Add gov_password to clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS gov_password text DEFAULT null;

-- Add fee, collaborator_name to declarations table
ALTER TABLE public.declarations ADD COLUMN IF NOT EXISTS fee numeric DEFAULT 0;
ALTER TABLE public.declarations ADD COLUMN IF NOT EXISTS collaborator_name text DEFAULT null;

-- Add payment_installments to declarations for tracking how many times client chose to pay tax
ALTER TABLE public.declarations ADD COLUMN IF NOT EXISTS tax_installments integer DEFAULT null;
