# 📸 Configuration Avatar et Biographie

## 1. Colonnes dans la table `profiles`

Exécutez ces requêtes SQL dans Supabase (SQL Editor) :

```sql
-- Ajouter les colonnes avatar_url et bio
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
```

## 2. Créer le bucket de stockage `avatars`

Dans Supabase Dashboard > Storage :

1. Cliquez sur **"New bucket"**
2. Nom du bucket : `avatars`
3. **Cochez** "Public bucket" ✅

## 3. Policies du bucket avatars

Dans Storage > avatars > Policies, ajoutez ces règles :

### Policy 1 : Lecture publique
```sql
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### Policy 2 : Upload par utilisateurs authentifiés
```sql
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3 : Suppression par propriétaire
```sql
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4 : Mise à jour par propriétaire
```sql
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 4. Modification du Backend (GET /mathys)

Dans votre backend Express, modifiez la requête GET /mathys pour inclure `avatar_url` :

```javascript
// ✅ NOUVEAU - GET /mathys avec avatar_url
if (req.method === "GET" && path === "/mathys") {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .select(`
      *,
      profiles!user_id(username, color, avatar_url)
    `)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  
  const messagesWithUsername = data.map(msg => ({
    ...msg,
    username: msg.profiles?.username || 'Utilisateur',
    user_color: msg.profiles?.color || '#3B82F6',
    avatar_url: msg.profiles?.avatar_url || null  // ⬅️ NOUVEAU
  }));
  
  return res.json(messagesWithUsername);
}
```

## 5. Script SQL complet

Copiez ce script dans Supabase SQL Editor :

```sql
-- =============================================
-- SETUP AVATAR ET BIO COMPLET
-- =============================================

-- 1. Ajouter les colonnes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

-- 2. Vérifier que le bucket avatars existe (à faire manuellement dans l'interface)

-- 3. Policies pour le bucket (exécuter après avoir créé le bucket)
-- Policy lecture publique
INSERT INTO storage.policies (name, bucket_id, definition)
SELECT 
  'Public read access for avatars',
  'avatars',
  '{"SELECT": true}'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE name = 'Public read access for avatars'
);

-- Note: Les autres policies doivent être créées via l'interface Supabase
-- ou via les requêtes CREATE POLICY ci-dessus
```

## 6. Vérification

Après la configuration, vérifiez :

1. ✅ La table `profiles` a les colonnes `avatar_url` et `bio`
2. ✅ Le bucket `avatars` existe et est public
3. ✅ Les policies sont configurées
4. ✅ Le backend retourne `avatar_url` dans les messages

## Fonctionnalités

- **Photo de profil** : Upload directement depuis le menu utilisateur (max 2MB)
- **Biographie** : Texte de 200 caractères max
- **Avatars dans les messages** : Affichés à côté du nom de l'auteur
- **Fallback** : Si pas d'avatar, affiche l'initiale du nom sur fond coloré
