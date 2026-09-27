-- Adds the two consent_type values needed for the new vehicle rental
-- legal agreements (src/lib/legal-agreements.ts: vehicle-host-agreement,
-- vehicle-renter-agreement). Applied directly to Neon.
ALTER TYPE consent_type ADD VALUE IF NOT EXISTS 'vehicle_host_agreement';
ALTER TYPE consent_type ADD VALUE IF NOT EXISTS 'vehicle_renter_agreement';
