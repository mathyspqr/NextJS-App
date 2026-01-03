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

-- 5. Activer la réplication pour la table profiles (statut en ligne)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- 6. Ajouter la table profiles à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 7. Activer la réplication pour la table private_messages
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;

-- 8. Ajouter la table private_messages à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;

-- 9. Activer la réplication pour la table friendships
ALTER TABLE public.friendships REPLICA IDENTITY FULL;

-- 10. Ajouter la table friendships à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- 11. Vérifier que la configuration est correcte
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('messages', 'comments', 'profiles', 'private_messages', 'friendships');

-- 12. Vérifier que la publication est active
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- ================================================
-- Notes importantes
-- ================================================
-- ✅ Une fois ces commandes exécutées, les changements
--    sur toutes ces tables seront diffusés en temps réel
--
-- ✅ Les événements suivants seront capturés :
--    - INSERT (nouveau message/commentaire/ami)
--    - UPDATE (message/commentaire/profil modifié)
--    - DELETE (message/commentaire/ami supprimé)
--
-- ✅ Realtime pour profiles permet de voir :
--    - Les changements de statut en ligne (last_seen)
--    - Les mises à jour de profil (avatar, bio, couleur)
--
-- ✅ Aucun redémarrage nécessaire - la configuration
--    est immédiate
