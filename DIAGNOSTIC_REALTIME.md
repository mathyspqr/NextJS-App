# 🔍 Diagnostic du Temps Réel - Étapes de Vérification

## ✅ Étape 1 : Vérifier la configuration Supabase

1. **Allez dans votre projet Supabase** → SQL Editor
2. **Exécutez cette requête** pour vérifier si les tables sont dans la publication :

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

**Résultat attendu :** Vous devez voir `messages` et `commentaires` dans la liste.

Si vous ne les voyez pas, exécutez :

```sql
-- Activer la réplication pour commentaires
ALTER TABLE public.commentaires REPLICA IDENTITY FULL;

-- Ajouter à la publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.commentaires;
```

## ✅ Étape 2 : Activer Realtime dans l'interface Supabase

1. Allez dans **Database** → **Replication**
2. Cherchez la table `commentaires`
3. **Activez le toggle** pour "Enable Realtime"
4. Faites de même pour la table `messages`

## ✅ Étape 3 : Vérifier les politiques RLS

Les politiques RLS peuvent bloquer les événements Realtime. Exécutez :

```sql
-- Voir les politiques actuelles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'commentaires';
```

Si nécessaire, créez une politique de lecture pour tous :

```sql
-- Politique pour lire tous les commentaires
CREATE POLICY "Permettre lecture commentaires à tous"
ON public.commentaires
FOR SELECT
TO authenticated
USING (true);
```

## ✅ Étape 4 : Test dans la console

Ouvrez la console (F12) et vérifiez :

1. **Les trois canaux sont SUBSCRIBED** ✅ (vous l'avez déjà)
2. Quand vous ajoutez un commentaire, cherchez dans la console :
   - `📨 Nouveau commentaire reçu via Realtime:`

Si ce message n'apparaît PAS sur l'autre compte, le problème est côté Supabase.

## ✅ Étape 5 : Forcer la reconnexion

Dans le code, après avoir exécuté les commandes SQL ci-dessus :

1. Fermez tous les onglets du navigateur
2. Rouvrez l'application
3. Ouvrez 2 comptes différents
4. Testez à nouveau

## 🔧 Solution Alternative : Utiliser les filtres de canal

Si le problème persiste, il se peut que vous deviez utiliser les filtres Supabase Realtime différemment.
