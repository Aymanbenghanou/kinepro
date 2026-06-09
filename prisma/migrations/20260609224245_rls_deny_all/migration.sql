-- Migration: rls_deny_all
--
-- Remplace la policy "allow_all" PERMISSIVE (USING true, WITH CHECK true)
-- qui exposait toutes les tables via PostgREST + clé anon publique.
-- La nouvelle policy "deny_all" refuse tout pour les rôles non-bypass.
--
-- ⚠️ Le rôle Prisma (postgres.<project_ref>) a rolbypassrls=true (confirmé)
-- → BYPASS RLS systématique → l'application n'est PAS impactée.
--
-- Effet attendu :
--   • PostgREST + clé anon : GET /rest/v1/<Table> → [] / 403 (fuite fermée).
--   • Prisma (rôle postgres) : aucun changement de comportement.

BEGIN;

DROP POLICY IF EXISTS "allow_all" ON public."BankAccount";
CREATE POLICY "deny_all" ON public."BankAccount" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Cabinet";
CREATE POLICY "deny_all" ON public."Cabinet" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Document";
CREATE POLICY "deny_all" ON public."Document" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."ExerciceProgram";
CREATE POLICY "deny_all" ON public."ExerciceProgram" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Facture";
CREATE POLICY "deny_all" ON public."Facture" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Feedback";
CREATE POLICY "deny_all" ON public."Feedback" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Paiement";
CREATE POLICY "deny_all" ON public."Paiement" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Patient";
CREATE POLICY "deny_all" ON public."Patient" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Praticien";
CREATE POLICY "deny_all" ON public."Praticien" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."PushSubscription";
CREATE POLICY "deny_all" ON public."PushSubscription" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."RendezVous";
CREATE POLICY "deny_all" ON public."RendezVous" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."Seance";
CREATE POLICY "deny_all" ON public."Seance" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."SeanceType";
CREATE POLICY "deny_all" ON public."SeanceType" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."User";
CREATE POLICY "deny_all" ON public."User" FOR ALL TO public USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "allow_all" ON public."WhatsAppLog";
CREATE POLICY "deny_all" ON public."WhatsAppLog" FOR ALL TO public USING (false) WITH CHECK (false);

COMMIT;
