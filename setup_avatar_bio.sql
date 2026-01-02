-- =============================================
-- SETUP AVATAR ET BIO - ChatFlow
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- 1. Ajouter les colonnes à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- 2. Vérifier les colonnes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- =============================================
-- IMPORTANT: Créer le bucket "avatars" manuellement
-- Storage > New bucket > "avatars" > Public: YES
-- =============================================

-- 3. Policies pour le bucket avatars
-- EXÉCUTER CES REQUÊTES APRÈS AVOIR CRÉÉ LE BUCKET

-- Policy: Lecture publique
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Upload par utilisateurs authentifiés (dans leur propre dossier)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Suppression par propriétaire
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Mise à jour par propriétaire
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Vérifier les politiques storage
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';

-- Tester un profil
SELECT id, username, color, avatar_url, bio FROM profiles LIMIT 5;
