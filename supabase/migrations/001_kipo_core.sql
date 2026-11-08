-- ============================================================================
-- MIGRATION INITIALE KIPO : 001_kipo_core.sql (Version consolidée & sécurisée)
-- ============================================================================
-- Sécurité RLS immédiate sur chaque table dès sa création
-- Aucune commande DROP TABLE, TRUNCATE ou suppression de données
-- Idempotent : réexécutable en toute sécurité
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ----------------------------------------------------------------------------
-- 2. TABLE EXISTANTE : profiles
-- ----------------------------------------------------------------------------
-- Activation RLS immédiate
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Ajout des colonnes manquantes sans altérer les colonnes existantes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT DEFAULT 'Apprenant KIPO',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS profile TEXT DEFAULT 'eleve' CHECK (profile IN ('eleve', 'etudiant', 'professeur')),
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'es')),
  ADD COLUMN IF NOT EXISTS level_title TEXT DEFAULT 'Apprenti Sagace',
  ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS hearts INTEGER DEFAULT 5 CHECK (hearts >= 0 AND hearts <= 5),
  ADD COLUMN IF NOT EXISTS max_hearts INTEGER DEFAULT 5 CHECK (max_hearts >= 1),
  ADD COLUMN IF NOT EXISTS gems INTEGER DEFAULT 60 CHECK (gems >= 0),
  ADD COLUMN IF NOT EXISTS questions_answered INTEGER DEFAULT 8 CHECK (questions_answered >= 0),
  ADD COLUMN IF NOT EXISTS quizzes_completed INTEGER DEFAULT 2 CHECK (quizzes_completed >= 0),
  ADD COLUMN IF NOT EXISTS cards_mastered INTEGER DEFAULT 6 CHECK (cards_mastered >= 0),
  ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Synchronisation douce du nom si display_name est renseigné
UPDATE public.profiles
SET full_name = COALESCE(NULLIF(display_name, ''), 'Apprenant KIPO')
WHERE full_name IS NULL OR full_name = 'Apprenant KIPO';

-- Politiques RLS profiles
DO $$ BEGIN
  DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
  DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
END $$;

CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Trigger d'inscription automatique pour les nouveaux comptes auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    display_name,
    profile,
    language,
    xp,
    level,
    level_title,
    hearts,
    gems
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Apprenant KIPO'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Apprenant KIPO'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'eleve'),
    'fr',
    120,
    2,
    'Apprenti Sagace',
    5,
    60
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction sécurisée serveur anti-triche : XP, gemmes, cœurs
CREATE OR REPLACE FUNCTION public.update_user_progress(
  xp_gain INTEGER,
  gems_gain INTEGER,
  hearts_delta INTEGER,
  answered_increment INTEGER DEFAULT 1
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_uid UUID;
  v_current_hearts INT;
  v_new_hearts INT;
  v_res JSONB;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Action non autorisée : utilisateur non authentifié.';
  END IF;

  SELECT hearts INTO v_current_hearts FROM public.profiles WHERE id = v_uid;
  v_new_hearts := GREATEST(0, LEAST(5, COALESCE(v_current_hearts, 5) + hearts_delta));

  UPDATE public.profiles
  SET
    xp = GREATEST(0, xp + GREATEST(0, xp_gain)),
    gems = GREATEST(0, gems + gems_gain),
    hearts = v_new_hearts,
    questions_answered = questions_answered + GREATEST(0, answered_increment),
    last_active_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = v_uid
  RETURNING jsonb_build_object(
    'xp', xp,
    'gems', gems,
    'hearts', hearts,
    'questions_answered', questions_answered
  ) INTO v_res;

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION public.update_user_progress FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_progress TO authenticated;


-- ----------------------------------------------------------------------------
-- 3. TABLE EXISTANTE : conversations
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS profile TEXT DEFAULT 'eleve' CHECK (profile IN ('eleve', 'etudiant', 'professeur'));

DO $$ BEGIN
  DROP POLICY IF EXISTS "conv_select_policy" ON public.conversations;
  DROP POLICY IF EXISTS "conv_insert_policy" ON public.conversations;
  DROP POLICY IF EXISTS "conv_update_policy" ON public.conversations;
  DROP POLICY IF EXISTS "conv_delete_policy" ON public.conversations;
END $$;

CREATE POLICY "conv_select_policy" ON public.conversations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "conv_insert_policy" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "conv_update_policy" ON public.conversations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "conv_delete_policy" ON public.conversations
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 4. TABLE EXISTANTE : conversation_messages
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "conv_msg_select_policy" ON public.conversation_messages;
  DROP POLICY IF EXISTS "conv_msg_insert_policy" ON public.conversation_messages;
  DROP POLICY IF EXISTS "conv_msg_update_policy" ON public.conversation_messages;
  DROP POLICY IF EXISTS "conv_msg_delete_policy" ON public.conversation_messages;
END $$;

CREATE POLICY "conv_msg_select_policy" ON public.conversation_messages
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

CREATE POLICY "conv_msg_insert_policy" ON public.conversation_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

CREATE POLICY "conv_msg_update_policy" ON public.conversation_messages
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );

CREATE POLICY "conv_msg_delete_policy" ON public.conversation_messages
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())
  );


-- ----------------------------------------------------------------------------
-- 5. NOUVELLE TABLE : documents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  summary TEXT DEFAULT '',
  key_concepts JSONB DEFAULT '[]'::jsonb,
  study_tip TEXT DEFAULT '',
  suggested_questions JSONB DEFAULT '[]'::jsonb,
  raw_text_preview TEXT DEFAULT '',
  storage_path TEXT,
  question_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS immédiate
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "documents_select_policy" ON public.documents;
  DROP POLICY IF EXISTS "documents_insert_policy" ON public.documents;
  DROP POLICY IF EXISTS "documents_update_policy" ON public.documents;
  DROP POLICY IF EXISTS "documents_delete_policy" ON public.documents;
END $$;

CREATE POLICY "documents_select_policy" ON public.documents
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "documents_insert_policy" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update_policy" ON public.documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_delete_policy" ON public.documents
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 6. NOUVELLE TABLE : duolingo_paths
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.duolingo_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  user_request TEXT,
  total_questions INTEGER DEFAULT 100,
  lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  units JSONB DEFAULT '[]'::jsonb,
  doc_summary TEXT,
  doc_key_concepts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS immédiate
ALTER TABLE public.duolingo_paths ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_duolingo_paths_user_id ON public.duolingo_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_duolingo_paths_doc_id ON public.duolingo_paths(document_id);

-- Validation d'appartenance du document
CREATE OR REPLACE FUNCTION public.check_duolingo_path_document_ownership()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.document_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = NEW.document_id AND d.user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Le document référencé n''appartient pas à cet utilisateur.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_duolingo_path_doc_owner ON public.duolingo_paths;
CREATE TRIGGER tr_duolingo_path_doc_owner
  BEFORE INSERT OR UPDATE ON public.duolingo_paths
  FOR EACH ROW EXECUTE FUNCTION public.check_duolingo_path_document_ownership();

DO $$ BEGIN
  DROP POLICY IF EXISTS "duolingo_paths_select_policy" ON public.duolingo_paths;
  DROP POLICY IF EXISTS "duolingo_paths_insert_policy" ON public.duolingo_paths;
  DROP POLICY IF EXISTS "duolingo_paths_update_policy" ON public.duolingo_paths;
  DROP POLICY IF EXISTS "duolingo_paths_delete_policy" ON public.duolingo_paths;
END $$;

CREATE POLICY "duolingo_paths_select_policy" ON public.duolingo_paths
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "duolingo_paths_insert_policy" ON public.duolingo_paths
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "duolingo_paths_update_policy" ON public.duolingo_paths
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "duolingo_paths_delete_policy" ON public.duolingo_paths
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 7. NOUVELLE TABLE : quizzes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Moyen',
  time_limit_seconds INTEGER DEFAULT 60,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  times_played INTEGER DEFAULT 0 CHECK (times_played >= 0),
  best_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS immédiate
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON public.quizzes(user_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "quizzes_select" ON public.quizzes;
  DROP POLICY IF EXISTS "quizzes_insert" ON public.quizzes;
  DROP POLICY IF EXISTS "quizzes_update" ON public.quizzes;
  DROP POLICY IF EXISTS "quizzes_delete" ON public.quizzes;
END $$;

CREATE POLICY "quizzes_select" ON public.quizzes
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "quizzes_insert" ON public.quizzes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "quizzes_update" ON public.quizzes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "quizzes_delete" ON public.quizzes
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 8. NOUVELLE TABLE : flashcard_decks
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  times_reviewed INTEGER DEFAULT 0 CHECK (times_reviewed >= 0),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS immédiate
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);

DO $$ BEGIN
  DROP POLICY IF EXISTS "flashcard_decks_select" ON public.flashcard_decks;
  DROP POLICY IF EXISTS "flashcard_decks_insert" ON public.flashcard_decks;
  DROP POLICY IF EXISTS "flashcard_decks_update" ON public.flashcard_decks;
  DROP POLICY IF EXISTS "flashcard_decks_delete" ON public.flashcard_decks;
END $$;

CREATE POLICY "flashcard_decks_select" ON public.flashcard_decks
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "flashcard_decks_insert" ON public.flashcard_decks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "flashcard_decks_update" ON public.flashcard_decks
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "flashcard_decks_delete" ON public.flashcard_decks
  FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 9. NOUVELLE TABLE : study_groups
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  subject TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL DEFAULT 'Membre KIPO',
  permissions JSONB DEFAULT '{
    "whoCanShareDocs": "all",
    "whoCanCreateQuizzes": "all",
    "defaultDocAccess": "read_only"
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS immédiate
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- 10. NOUVELLE TABLE : study_group_members
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  profile TEXT DEFAULT 'eleve' CHECK (profile IN ('eleve', 'etudiant', 'professeur')),
  xp_contributed INTEGER DEFAULT 0 CHECK (xp_contributed >= 0),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

-- Activation RLS immédiate
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.study_group_members(group_id);

-- Auto-inscription du créateur comme admin
CREATE OR REPLACE FUNCTION public.handle_study_group_creator()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.study_group_members (group_id, user_id, role, profile)
  VALUES (
    NEW.id,
    NEW.created_by,
    'admin',
    (SELECT COALESCE(profile, 'eleve') FROM public.profiles WHERE id = NEW.created_by)
  )
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'admin';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_after_create_study_group ON public.study_groups;
CREATE TRIGGER tr_after_create_study_group
  AFTER INSERT ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_study_group_creator();


-- ----------------------------------------------------------------------------
-- 11. NOUVELLE TABLE : study_group_shared_documents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_group_shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by_name TEXT NOT NULL DEFAULT 'Membre KIPO',
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  permission TEXT NOT NULL DEFAULT 'read_only' CHECK (permission IN ('read_only', 'interactive')),
  summary TEXT DEFAULT '',
  key_concepts JSONB DEFAULT '[]'::jsonb,
  question_count INTEGER DEFAULT 20
);

-- Activation RLS immédiate
ALTER TABLE public.study_group_shared_documents ENABLE ROW LEVEL SECURITY;


-- ----------------------------------------------------------------------------
-- 12. NOUVELLE TABLE : group_join_attempts (Protection Anti-Bruteforce)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_join_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempted_code TEXT,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation RLS immédiate
ALTER TABLE public.group_join_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_group_join_attempts_user_time 
  ON public.group_join_attempts(user_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- 13. NOUVELLE TABLE : group_messages
-- ----------------------------------------------------------------------------
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

-- Activation RLS immédiate
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_group_messages_group ON public.group_messages(group_id);

-- Trigger anti-usurpation d'identité
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


-- ----------------------------------------------------------------------------
-- 14. POLITIQUES RLS DU MODULE GROUPES
-- ----------------------------------------------------------------------------
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

-- Politiques study_groups
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

-- Politiques study_group_members
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

-- Politiques study_group_shared_documents
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

-- Politiques group_messages
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

-- Politiques group_join_attempts
CREATE POLICY "attempts_owner_select" ON public.group_join_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fonction sécurisée d'adhésion par code (Anti-Bruteforce)
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


-- ----------------------------------------------------------------------------
-- 15. SUPABASE STORAGE (BUCKET PRIVÉ user_documents & POLITIQUES DE SÉCURITÉ)
-- ----------------------------------------------------------------------------
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
