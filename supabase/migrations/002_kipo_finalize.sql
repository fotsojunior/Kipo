-- ============================================================================
-- FINALISATION MIGRATION KIPO : 002_kipo_finalize.sql
-- À exécuter dans le SQL Editor de Supabase pour compléter les éléments restants :
-- 1. Table group_join_attempts (Anti-bruteforce)
-- 2. Table group_messages (Messagerie collaborative)
-- 3. Fonction RPC join_study_group_with_code
-- 4. Politiques RLS des groupes et des messages
-- 5. Bucket de stockage privé user_documents
-- ============================================================================

-- 1. TABLE : group_join_attempts (Protection Anti-Bruteforce)
CREATE TABLE IF NOT EXISTS public.group_join_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_code TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_join_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_group_join_attempts_user_time 
  ON public.group_join_attempts(user_id, created_at DESC);


-- 2. TABLE : group_messages (Messagerie d'équipe)
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL DEFAULT 'Membre KIPO',
  sender_role TEXT NOT NULL DEFAULT 'member' CHECK (sender_role IN ('admin', 'member', 'ai_moderator')),
  content TEXT NOT NULL,
  is_ai_summary BOOLEAN DEFAULT FALSE,
  is_moderation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id);

-- Trigger anti-usurpation d'identité sur les messages de groupe
CREATE OR REPLACE FUNCTION public.sanitize_group_message()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_real_role TEXT;
  v_real_name TEXT;
BEGIN
  NEW.sender_id := auth.uid();

  SELECT role INTO v_real_role
  FROM public.study_group_members
  WHERE group_id = NEW.group_id AND user_id = auth.uid();

  IF v_real_role IS NULL THEN
    RAISE EXCEPTION 'Vous devez être membre de ce groupe pour publier.';
  END IF;

  SELECT COALESCE(full_name, 'Apprenant KIPO') INTO v_real_name
  FROM public.profiles
  WHERE id = auth.uid();

  NEW.sender_name := v_real_name;

  IF NEW.sender_role = 'ai_moderator' AND v_real_role <> 'admin' THEN
    NEW.sender_role := v_real_role;
    NEW.is_moderation := FALSE;
  ELSE
    NEW.sender_role := v_real_role;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sanitize_group_msg ON public.group_messages;
CREATE TRIGGER tr_sanitize_group_msg
  BEFORE INSERT ON public.group_messages
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_group_message();


-- 3. POLITIQUES RLS DU MODULE GROUPES
DO $$ BEGIN
  DROP POLICY IF EXISTS "study_groups_select" ON public.study_groups;
  DROP POLICY IF EXISTS "study_groups_insert" ON public.study_groups;
  DROP POLICY IF EXISTS "study_groups_update" ON public.study_groups;
  DROP POLICY IF EXISTS "study_groups_delete" ON public.study_groups;

  DROP POLICY IF EXISTS "study_members_select" ON public.study_group_members;
  DROP POLICY IF EXISTS "study_members_update" ON public.study_group_members;
  DROP POLICY IF EXISTS "study_members_delete" ON public.study_group_members;

  DROP POLICY IF EXISTS "shared_docs_select" ON public.study_group_shared_documents;
  DROP POLICY IF EXISTS "shared_docs_insert" ON public.study_group_shared_documents;
  DROP POLICY IF EXISTS "shared_docs_delete" ON public.study_group_shared_documents;

  DROP POLICY IF EXISTS "group_msgs_select" ON public.group_messages;
  DROP POLICY IF EXISTS "group_msgs_insert" ON public.group_messages;

  DROP POLICY IF EXISTS "attempts_owner_select" ON public.group_join_attempts;
END $$;

CREATE POLICY "study_groups_select" ON public.study_groups
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.study_group_members m WHERE m.group_id = id AND m.user_id = auth.uid())
  );

CREATE POLICY "study_groups_insert" ON public.study_groups
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "study_groups_update" ON public.study_groups
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "study_groups_delete" ON public.study_groups
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "study_members_select" ON public.study_group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members me
      WHERE me.group_id = study_group_members.group_id AND me.user_id = auth.uid()
    )
  );

CREATE POLICY "study_members_update" ON public.study_group_members
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_groups g
      WHERE g.id = study_group_members.group_id AND g.created_by = auth.uid()
    ) AND study_group_members.user_id <> auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.study_groups g
      WHERE g.id = study_group_members.group_id AND g.created_by = auth.uid()
    )
  );

CREATE POLICY "study_members_delete" ON public.study_group_members
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_groups g
      WHERE g.id = study_group_members.group_id AND g.created_by = auth.uid()
    )
  );

CREATE POLICY "shared_docs_select" ON public.study_group_shared_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = study_group_shared_documents.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "shared_docs_insert" ON public.study_group_shared_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    shared_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = study_group_shared_documents.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "shared_docs_delete" ON public.study_group_shared_documents
  FOR DELETE TO authenticated
  USING (
    shared_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.study_groups g
      WHERE g.id = study_group_shared_documents.group_id AND g.created_by = auth.uid()
    )
  );

CREATE POLICY "group_msgs_select" ON public.group_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = group_messages.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "group_msgs_insert" ON public.group_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.study_group_members m
      WHERE m.group_id = group_messages.group_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "attempts_owner_select" ON public.group_join_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- 4. FONCTION SÉCURISÉE RPC : join_study_group_with_code
CREATE OR REPLACE FUNCTION public.join_study_group_with_code(code_input TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_clean_code TEXT;
  v_recent_failures INT;
  v_group_id UUID;
  v_user_profile TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHENTICATED');
  END IF;

  v_clean_code := UPPER(TRIM(code_input));

  SELECT COUNT(*) INTO v_recent_failures
  FROM public.group_join_attempts
  WHERE user_id = v_uid
    AND success = FALSE
    AND created_at > (NOW() - INTERVAL '15 minutes');

  IF v_recent_failures >= 5 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RATE_LIMITED',
      'message', 'Trop de tentatives infructueuses. Veuillez patienter 15 minutes.'
    );
  END IF;

  SELECT id INTO v_group_id
  FROM public.study_groups
  WHERE UPPER(TRIM(invite_code)) = v_clean_code;

  IF v_group_id IS NULL THEN
    INSERT INTO public.group_join_attempts (user_id, attempted_code, success, created_at)
    VALUES (v_uid, v_clean_code, FALSE, NOW());

    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_CODE',
      'attempts_left', GREATEST(0, 4 - v_recent_failures)
    );
  END IF;

  INSERT INTO public.group_join_attempts (user_id, attempted_code, success, created_at)
  VALUES (v_uid, v_clean_code, TRUE, NOW());

  SELECT COALESCE(profile, 'eleve') INTO v_user_profile
  FROM public.profiles
  WHERE id = v_uid;

  INSERT INTO public.study_group_members (group_id, user_id, role, profile)
  VALUES (v_group_id, v_uid, 'member', COALESCE(v_user_profile, 'eleve'))
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'group_id', v_group_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.join_study_group_with_code FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_study_group_with_code TO authenticated;


-- 5. BUCKET DE STOCKAGE PRIVÉ : user_documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user_documents',
  'user_documents',
  false,
  20971520, -- 20 Mo
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];

UPDATE storage.buckets SET public = false WHERE id = 'user_documents';

DO $$ BEGIN
  DROP POLICY IF EXISTS "storage_user_docs_select" ON storage.objects;
  DROP POLICY IF EXISTS "storage_user_docs_insert" ON storage.objects;
  DROP POLICY IF EXISTS "storage_user_docs_update" ON storage.objects;
  DROP POLICY IF EXISTS "storage_user_docs_delete" ON storage.objects;
END $$;

CREATE POLICY "storage_user_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'user_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_user_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'user_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_user_docs_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'user_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "storage_user_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'user_documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
