# 📸 Configuration du Storage Supabase pour les images

## Étape 1 : Créer le bucket de stockage

1. **Allez dans votre dashboard Supabase**
2. Cliquez sur **Storage** dans le menu de gauche
3. Cliquez sur **"New bucket"**
4. Configurez le bucket :
   - **Name:** `message-images`
   - **Public bucket:** ✅ Coché (pour que les images soient accessibles publiquement)
   - Cliquez sur **"Create bucket"**

## Étape 2 : Configurer les politiques de sécurité

Dans le SQL Editor de Supabase, exécutez ces commandes :

```sql
-- Permettre aux utilisateurs authentifiés d'uploader des images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-images');

-- Permettre à tout le monde de lire les images
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-images');

-- Permettre aux utilisateurs de supprimer leurs propres images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Étape 3 : Ajouter la colonne image_url

Exécutez le fichier `setup_images.sql` dans le SQL Editor.

## Étape 4 : Configuration terminée ! ✅

Vous pouvez maintenant :
- Uploader des images dans vos messages
- Les images sont stockées dans Supabase Storage
- Les URLs sont sauvegardées dans la base de données
- Les images sont visibles par tous les utilisateurs
