-- ================================================
-- Correction des politiques RLS pour la table profiles
-- ================================================
-- Exécutez ces commandes dans le SQL Editor de Supabase

-- 1. Vérifier si la colonne color existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'color';

-- 2. Ajouter la colonne si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- 3. Mettre à jour les profils existants
UPDATE public.profiles 
SET color = '#3B82F6' 
WHERE color IS NULL OR color = '';

-- 4. Vérifier les politiques actuelles
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Supprimer l'ancienne politique UPDATE si elle existe
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leur profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 6. Créer une nouvelle politique UPDATE pour permettre aux utilisateurs de modifier leur profil
CREATE POLICY "Utilisateurs peuvent modifier leur profil"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. Vérifier que la politique SELECT existe (pour lire les profils)
-- Si elle n'existe pas, créez-la
CREATE POLICY IF NOT EXISTS "Permettre lecture profils à tous"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 8. Vérifier toutes les politiques maintenant
SELECT 
    policyname, 
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual::text 
        ELSE 'N/A' 
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check::text 
        ELSE 'N/A' 
    END as with_check_clause
FROM pg_policies 
WHERE tablename = 'profiles';

-- 9. Test : Vérifier votre profil actuel (remplacez par votre ID utilisateur)
-- SELECT id, username, color FROM public.profiles WHERE id = 'bdb430f3-ff11-4186-8134-fea7d743dafa';

-- 10. Test : Essayer une mise à jour manuelle
-- UPDATE public.profiles 
-- SET color = '#ff7b00' 
-- WHERE id = 'bdb430f3-ff11-4186-8134-fea7d743dafa';
