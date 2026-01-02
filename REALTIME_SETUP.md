# Configuration Supabase Realtime - Messages & Commentaires

## ⚠️ Configuration requise dans Supabase

Pour que le temps réel fonctionne, vous devez :
1. Activer la réplication sur les tables `messages` et `commentaires`
2. Ajouter la colonne `username` aux deux tables

### 📝 Fichiers SQL à exécuter

**Exécutez ces 3 fichiers dans le SQL Editor de Supabase (dans cet ordre) :**

1. **`supabase_realtime_config.sql`**
   - Active la réplication pour `messages` et `commentaires`
   
2. **`supabase_add_username_to_messages.sql`**
   - Ajoute la colonne `username` à la table `messages`
   - Crée un trigger pour remplir automatiquement le username
   
3. **`supabase_add_username_to_commentaires.sql`**
   - Ajoute la colonne `username` à la table `commentaires`
   - Crée un trigger pour remplir automatiquement le username

## ✅ Vérification

**Test Messages en temps réel :**
1. Ouvrez l'app dans **2 navigateurs différents**
2. Connectez-vous avec **2 comptes différents**
3. Envoyez un message depuis le premier
4. ✅ Le message apparaît instantanément dans le second avec le bon username
5. ✅ Notification "📨 Nouveau message de [username]"

**Test Commentaires en temps réel :**
1. Ouvrez les commentaires d'un message dans les 2 navigateurs
2. Ajoutez un commentaire depuis le premier
3. ✅ Le commentaire apparaît instantanément dans le second avec le bon username
4. ✅ Notification "💬 Nouveau commentaire de [username]"

**Test Indicateur typing :**
1. Commencez à écrire un message dans le premier navigateur
2. ✅ L'indicateur "[username] est en train d'écrire..." apparaît dans le second

## 🔧 Fonctionnalités implémentées

### 1. Messages en temps réel ⚡
- ✅ Nouveaux messages instantanés sans refresh
- ✅ Messages supprimés disparaissent en temps réel
- ✅ Username correct affiché automatiquement
- ✅ Notifications push dans l'interface
- ✅ WebSocket via Supabase Realtime

### 2. Commentaires en temps réel 💬
- ✅ Nouveaux commentaires instantanés
- ✅ Username correct affiché automatiquement
- ✅ Notifications pour chaque nouveau commentaire
- ✅ Synchronisation entre tous les utilisateurs
- ✅ Pas besoin de refresh

### 3. Notifications 🔔
- ✅ Toast "Nouveau message de [username]" (3s)
- ✅ Toast "Nouveau commentaire de [username]" (2.5s)
- ✅ Uniquement pour les messages/commentaires des autres
- ✅ Position top-right

### 4. Indicateur "typing..." ⌨️
- ✅ Affiche qui écrit en temps réel
- ✅ Plusieurs utilisateurs simultanés supportés
- ✅ Disparaît après 3 secondes d'inactivité
- ✅ Animation pulse fluide

### 5. Scroll automatique 📜
- ✅ Scroll vers le bas pour nouveaux messages
- ✅ Animation smooth
- ✅ Ne perturbe pas la lecture de l'historique

## 🎨 Architecture technique

### Channels WebSocket

**1. `public:messages`**
- Écoute INSERT/DELETE sur table `messages`
- Récupère username depuis `profiles`
- Notifie tous les clients connectés

**2. `public:commentaires`**
- Écoute INSERT sur table `commentaires`
- Récupère username depuis `profiles`
- Met à jour la liste des commentaires du message concerné

**3. `typing-indicator`**
- Channel broadcast (pas de base de données)
- Communication directe entre clients
- Timeout automatique après 3 secondes

### Performance
- Nettoyage automatique des channels au démontage
- Récupération optimisée du username (une seule requête)
- `useCallback` pour éviter les re-renders
- WebSocket persistant avec reconnexion auto

## 🚀 Améliorations futures

- [ ] Son de notification (toggle on/off)
- [ ] Compteur de messages/commentaires non lus
- [ ] Badge sur titre de page
- [ ] Vibration mobile
- [ ] Indicateur de présence (en ligne/hors ligne)
- [ ] Statut "vu" pour messages
- [ ] Réactions emoji en temps réel
- [ ] Suppression commentaires en temps réel
- [ ] Modification commentaires en temps réel
- [ ] Typing indicator pour commentaires
