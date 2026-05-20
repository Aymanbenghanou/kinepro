-- Enable Row Level Security on every table.
-- App-layer auth: NextAuth + Prisma — all authorization lives in the Next.js
-- API routes, so policies here are intentionally permissive ("allow_all").
-- Goal: silence Supabase's RLS warnings without changing behaviour.

-- ── Enable RLS ──────────────────────────────────────────────────────────────
ALTER TABLE "User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cabinet"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Praticien"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RendezVous"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Seance"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Facture"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Paiement"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SeanceType"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CabinetSite"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankAccount"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Feedback"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WhatsAppLog"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemConfig"     ENABLE ROW LEVEL SECURITY;

-- ── Permissive policies ─────────────────────────────────────────────────────
-- Idempotent: DROP first so this migration can be re-run safely.
DROP POLICY IF EXISTS "allow_all" ON "User";
DROP POLICY IF EXISTS "allow_all" ON "Cabinet";
DROP POLICY IF EXISTS "allow_all" ON "Patient";
DROP POLICY IF EXISTS "allow_all" ON "Praticien";
DROP POLICY IF EXISTS "allow_all" ON "RendezVous";
DROP POLICY IF EXISTS "allow_all" ON "Seance";
DROP POLICY IF EXISTS "allow_all" ON "Facture";
DROP POLICY IF EXISTS "allow_all" ON "Paiement";
DROP POLICY IF EXISTS "allow_all" ON "Document";
DROP POLICY IF EXISTS "allow_all" ON "SeanceType";
DROP POLICY IF EXISTS "allow_all" ON "Subscription";
DROP POLICY IF EXISTS "allow_all" ON "CabinetSite";
DROP POLICY IF EXISTS "allow_all" ON "Testimonial";
DROP POLICY IF EXISTS "allow_all" ON "BankAccount";
DROP POLICY IF EXISTS "allow_all" ON "PushSubscription";
DROP POLICY IF EXISTS "allow_all" ON "Feedback";
DROP POLICY IF EXISTS "allow_all" ON "WhatsAppLog";
DROP POLICY IF EXISTS "allow_all" ON "SystemConfig";

CREATE POLICY "allow_all" ON "User"             FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Cabinet"          FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Patient"          FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Praticien"        FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "RendezVous"       FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Seance"           FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Facture"          FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Paiement"         FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Document"         FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "SeanceType"       FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Subscription"     FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "CabinetSite"      FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Testimonial"      FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "BankAccount"      FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "PushSubscription" FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "Feedback"         FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "WhatsAppLog"      FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON "SystemConfig"     FOR ALL TO public USING (true) WITH CHECK (true);
