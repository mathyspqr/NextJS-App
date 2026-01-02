-- ================================================
-- Script de diagnostic pour la colonne color
-- ================================================
-- Exécutez ces commandes une par une dans le SQL Editor

-- 1. Vérifier si la colonne color existe dans profiles
SELECT column_name, data_type, character_maximum_length, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND table_schema = 'public';

-- 2. Si la colonne n'existe pas, l'ajouter
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- 3. Mettre à jour tous les profils sans couleur
UPDATE public.profiles 
SET color = '#3B82F6' 
WHERE color IS NULL OR color = '';

-- 4. Vérifier les données actuelles
SELECT id, username, color, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Tester la mise à jour manuelle (remplacez USER_ID_ICI par votre ID)
-- UPDATE public.profiles 
-- SET color = '#EF4444' 
-- WHERE id = 'USER_ID_ICI';

-- 6. Vérifier les permissions sur la table profiles
SELECT 
    schemaname,
    tablename,
    tableowner,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 7. Vérifier les politiques RLS sur profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';
