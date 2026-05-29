-- Convertit ONGOING/COMPLETED/ARCHIVED → PUBLISHED
-- Le statut affiché (À venir / En cours / Terminé) est désormais calculé depuis les dates
UPDATE "Event" SET "status" = 'PUBLISHED' WHERE "status" IN ('ONGOING', 'COMPLETED', 'ARCHIVED');
