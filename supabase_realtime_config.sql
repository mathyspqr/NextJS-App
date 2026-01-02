-- ================================================
-- Configuration Supabase Realtime
-- ================================================
-- À exécuter dans le SQL Editor de votre projet Supabase

-- 1. Activer la réplication pour la table messages
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Ajouter la table messages à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 3. Activer la réplication pour la table comments
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- 4. Ajouter la table comments à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- 5. Vérifier que la configuration est correcte
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('messages', 'comments');

-- 6. Vérifier que la publication est active
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ================================================
-- Notes importantes
-- ================================================
-- ✅ Une fois ces commandes exécutées, les changements
--    sur les tables 'messages' et 'comments' seront 
--    diffusés en temps réel à tous les clients connectés
--
-- ✅ Les événements suivants seront capturés :
--    - INSERT (nouveau message/commentaire)
--    - UPDATE (message/commentaire modifié)
--    - DELETE (message/commentaire supprimé)
--
-- ✅ Aucun redémarrage nécessaire - la configuration
--    est immédiate
