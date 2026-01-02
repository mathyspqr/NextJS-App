# 📋 Guide Complet : Upload d'Images

## 🎯 Vue d'ensemble

Le système permet aux utilisateurs d'envoyer des images avec leurs messages. Les images sont stockées dans Supabase Storage et les URLs sont sauvegardées dans la base de données.

## 📝 Étapes de configuration

### Étape 1 : Configuration de la base de données

Exécutez dans le SQL Editor de Supabase :

```sql
-- Ajouter la colonne image_url
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### Étape 2 : Créer le bucket de stockage

1. Dashboard Supabase → **Storage**
2. Cliquez sur **"New bucket"**
3. Nom: `message-images`
4. ✅ Cochez **"Public bucket"**
5. Créer

### Étape 3 : Configurer les politiques RLS

Exécutez dans le SQL Editor :

```sql
-- Upload par utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'message-images');

-- Lecture publique
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-images');

-- Suppression par propriétaire
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'message-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Étape 4 : Modifier le backend

Dans votre fichier backend (server.js ou index.js), modifiez la route POST :

```javascript
app.post('/insert-message', verifyToken, async (req, res) => {
  const { message, image_url } = req.body;
  const user_id = req.user.id;

  const { data, error } = await supabase
    .from('messages')
    .insert([{ message, user_id, image_url }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
```

### Étape 5 : Redémarrer le backend

```bash
# Arrêtez le serveur (Ctrl+C)
# Redémarrez-le
node server.js
# ou
npm run dev
```

### Étape 6 : Tester !

1. Rechargez votre application frontend (F5)
2. Cliquez sur l'icône 🖼️ à côté du champ de message
3. Sélectionnez une image (max 5MB)
4. Écrivez un message (optionnel)
5. Envoyez
6. L'image devrait s'afficher ! 🎉

## ✨ Fonctionnalités

- ✅ Upload d'images (JPG, PNG, GIF, etc.)
- ✅ Prévisualisation avant envoi
- ✅ Limite de 5MB par image
- ✅ Images stockées dans Supabase Storage
- ✅ URLs sauvegardées en base de données
- ✅ Affichage responsive des images
- ✅ Clic pour ouvrir en plein écran
- ✅ Temps réel (les images apparaissent instantanément)

## 🐛 Dépannage

### L'image ne s'upload pas
- Vérifiez que le bucket `message-images` existe
- Vérifiez les politiques RLS du bucket
- Vérifiez la console pour les erreurs

### L'image ne s'affiche pas
- Vérifiez que la colonne `image_url` existe dans la table `messages`
- Vérifiez que le backend retourne bien `image_url`
- Vérifiez les logs de la console (F12)

### Erreur 413 (Payload too large)
- L'image est trop grande (> 5MB)
- Réduisez la taille de l'image

## 📂 Fichiers créés

- ✅ `setup_images.sql` - Script SQL pour ajouter la colonne
- ✅ `STORAGE_SETUP.md` - Guide de configuration du Storage
- ✅ `BACKEND_IMAGE_SETUP.md` - Guide de modification du backend
- ✅ Code frontend modifié pour gérer les images

## 🚀 Prêt à l'emploi !

Une fois toutes les étapes complétées, votre système d'upload d'images est opérationnel !
