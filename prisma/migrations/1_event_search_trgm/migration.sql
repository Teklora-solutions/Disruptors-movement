-- Trigram matching for event search. Ships with the official postgres image (contrib).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Event_title_idx" ON "Event" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Event_description_idx" ON "Event" USING GIN ("description" gin_trgm_ops);

