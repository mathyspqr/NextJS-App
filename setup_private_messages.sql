-- ============================================
-- Configuration des messages privés pour ChatFlow
-- ============================================

-- 1️⃣ Créer la table private_messages
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    
    -- Contrainte: on ne peut pas s'envoyer un message à soi-même
    CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- 2️⃣ Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON public.private_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_receiver ON public.private_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON public.private_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_conversation ON public.private_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_private_messages_unread ON public.private_messages(receiver_id, read) WHERE read = false;

-- 3️⃣ Activer RLS
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- 4️⃣ Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own private messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can send private messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.private_messages;
DROP POLICY IF EXISTS "Users can delete their own sent messages" ON public.private_messages;

-- 5️⃣ Créer les policies RLS

-- Policy SELECT: Un utilisateur peut voir les messages qu'il a envoyés ou reçus
CREATE POLICY "Users can view their own private messages"
ON public.private_messages
FOR SELECT
USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
);

-- Policy INSERT: Un utilisateur peut envoyer des messages (sender_id doit être son ID)
-- Optionnel: vérifier que les deux utilisateurs sont amis
CREATE POLICY "Users can send private messages"
ON public.private_messages
FOR INSERT
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
        AND (
            (requester_id = auth.uid() AND addressee_id = receiver_id)
            OR (addressee_id = auth.uid() AND requester_id = receiver_id)
        )
    )
);

-- Policy UPDATE: Un utilisateur peut marquer comme lu les messages qu'il a reçus
CREATE POLICY "Users can update read status of received messages"
ON public.private_messages
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Policy DELETE: Un utilisateur peut supprimer les messages qu'il a envoyés
CREATE POLICY "Users can delete their own sent messages"
ON public.private_messages
FOR DELETE
USING (auth.uid() = sender_id);

-- 6️⃣ Activer Realtime pour la table (ignorer si déjà ajoutée)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- La table est déjà dans la publication
END $$;

-- 7️⃣ Vérification
SELECT 'Table private_messages créée avec succès!' as status;

-- ============================================
-- Pour tester, vous pouvez exécuter:
-- SELECT * FROM public.private_messages;
-- ============================================
