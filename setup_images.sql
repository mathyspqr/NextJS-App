-- ================================================
-- Configuration pour les images dans les messages
-- ================================================
-- À exécuter dans le SQL Editor de Supabase

-- 1. Ajouter la colonne image_url à la table messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Vérifier que la colonne a été ajoutée
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 3. Vérifier les données
SELECT id, message, image_url, created_at 
FROM public.messages 
ORDER BY created_at DESC 
LIMIT 5;
